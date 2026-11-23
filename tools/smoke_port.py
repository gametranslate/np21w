"""Boot a generated PC-98 test floppy and exercise the packaged player's UI."""
import argparse
import base64
import os
from pathlib import Path
import socket
import struct
import subprocess
import tempfile
import time
from playwright.sync_api import sync_playwright

MARK=b"NEKOSTATION_PORT_TEST:"
def test_disk():
    # The boot program copies a marker to 4000:0000, then waits for a BIOS key.
    code=bytearray.fromhex("eb 02 90 90 b8 00 40 8e c0 31 ff 0e 1f e8 00 00 5e 83 c6 00 b9 00 00 fc f3 a4 26 c7 05 21 21 b4 00 cd 18 26 89 05 eb f7")
    code[19]=len(code)-16;code[21]=len(MARK)
    size=77*2*8*1024
    data=bytearray(size)
    data[:len(code)+len(MARK)]=code+MARK
    data[510:512]=b"\x55\xaa"
    return struct.pack("<8I",0,0x90,4096,size,1024,8,2,77).ljust(4096,b"\x00")+data

def check(page):
    page.set_default_timeout(20000)
    page.on("pageerror",lambda err:print("Renderer error:",err,flush=True))
    page.on("console",lambda msg:print("Console:",msg.text[:350],flush=True) if msg.type=="error" else None)
    page.wait_for_selector("[data-view=settings]")
    assert page.locator("html").get_attribute("lang")=="en"
    page.locator("[data-view=settings]").click()
    page.locator("[data-bind=a]").click()
    page.keyboard.press("q")
    page.locator("[data-view=library]").click()
    encoded=base64.b64encode(test_disk()).decode()
    page.evaluate("""s=>{const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));
      const dt=new DataTransfer();dt.items.add(new File([bytes],'Runtime Check.fdi'));
      document.querySelector('main').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));}""",encoded)
    try:page.wait_for_selector("#play-surface")
    except Exception:
        print("Launcher status:",page.locator("#notice").text_content());raise
    frame=page.frame_locator("#portable-player iframe")
    frame.locator("canvas").wait_for()
    page.wait_for_timeout(2200)
    slot="""async ()=>{const db=await new Promise(r=>{const q=indexedDB.open('NekoStation-media');q.onsuccess=()=>r(q.result)});
      const read=fn=>new Promise(r=>{const q=fn(db.transaction('files').objectStore('files'));q.onsuccess=()=>r(q.result)});
      const key=(await read(s=>s.getAllKeys())).find(k=>k.startsWith('state/'));
      if(!key)return '';const {data}=await read(s=>s.get(key));const m=new TextEncoder().encode('NEKOSTATION_PORT_TEST:');
      for(let i=200000;i<data.length-m.length-2;i++)if(data[i]===m[0]&&m.every((v,n)=>v===data[i+n]))return Array.from(data.slice(i+m.length,i+m.length+2)).join(',');
      return 'marker missing';}"""
    def save_and_read():
        page.locator("[data-act=save]").click();page.wait_for_timeout(450);return page.evaluate(slot)
    for attempt in range(16):
        guest=save_and_read()
        if guest=="33,33":break
        page.wait_for_timeout(250)
    else:
        page.screenshot(path=str(Path(tempfile.gettempdir())/"nekostation-port-smoke.png"))
        raise AssertionError("Guest boot marker missing: "+guest+" / "+page.locator("#notice").text_content())
    page.locator("[data-act=fullscreen]").click()
    page.locator("#portable-player:fullscreen").wait_for()
    page.locator(".exit-player").click()
    page.locator("#portable-player:fullscreen").wait_for(state="detached")
    frame.locator("canvas").focus()
    page.keyboard.press("q")
    page.wait_for_timeout(200)
    page.locator("[data-act=load]").click();page.wait_for_timeout(450)
    assert save_and_read()=="33,33","Save-state restore failed"
    frame.locator("canvas").focus();page.keyboard.press("q");page.wait_for_timeout(200)
    actual=save_and_read()
    assert actual.split(",")[0] in ("90","122"),"Expected remapped Z in guest RAM, got "+actual
    page.locator("[data-act=stop]").click()
    page.wait_for_selector("#play-surface",state="detached")
    page.reload();page.wait_for_selector(".card")
    page.locator(".feature [data-act=play]").click();page.wait_for_selector("#play-surface")
    page.locator("[data-act=stop]").click();page.wait_for_selector("#play-surface",state="detached")
    print("PASS embedded boot, fullscreen, save/load, guest key remap and library reopen",flush=True)

def main():
    parser=argparse.ArgumentParser()
    group=parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--electron",type=Path);group.add_argument("--cdp")
    group.add_argument("--url")
    args=parser.parse_args()
    with tempfile.TemporaryDirectory() as data,sync_playwright() as p:
        proc=None
        try:
            url=args.cdp
            if args.electron:
                with socket.socket() as s:s.bind(("127.0.0.1",0));port=s.getsockname()[1]
                cmd=[str(args.electron.resolve()),"--remote-debugging-port="+str(port),"--user-data-dir="+data]
                if os.environ.get("NEKO_QA_NO_SANDBOX")=="1":cmd.append("--no-sandbox")
                proc=subprocess.Popen(cmd);url="http://127.0.0.1:"+str(port)
            if args.url:
                b=p.chromium.launch();page=b.new_page();page.goto(args.url);check(page);b.close();return
            for i in range(50):
                try:b=p.chromium.connect_over_cdp(url,timeout=1500);break
                except Exception:
                    if proc and proc.poll() is not None:raise RuntimeError("Packaged application exited")
                    if i==49:raise
                    time.sleep(.3)
            context=b.contexts[0]
            for i in range(80):
                page=next((page for page in context.pages if page.url.startswith(("neko://library/","https://nekostation.invalid/"))),None)
                if page:break
                time.sleep(.2)
            assert page,"No NekoStation renderer"
            check(page)
        finally:
            if proc:
                proc.terminate();proc.wait(timeout=10)
if __name__=="__main__":main()
