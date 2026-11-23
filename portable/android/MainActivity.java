package us.gametranslate.nekostation;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.*;
import android.widget.FrameLayout;
import java.io.*;
import java.util.*;

public final class MainActivity extends Activity {
    private static final String HOST = "nekostation.invalid";
    private static final int PICK = 31;
    private FrameLayout root;
    private WebView web;
    private ValueCallback<Uri[]> pending;
    private View full;
    private WebChromeClient.CustomViewCallback endFull;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web);
        setContentView(root);
        root.setOnApplyWindowInsetsListener((v,insets)->{
            if(full==null)root.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            else root.setPadding(0,0,0,0);
            return insets.consumeSystemWindowInsets();
        });
        WebSettings cfg = web.getSettings();
        cfg.setJavaScriptEnabled(true);
        cfg.setDomStorageEnabled(true);
        cfg.setAllowFileAccess(false);
        cfg.setAllowContentAccess(false);
        cfg.setMediaPlaybackRequiresUserGesture(false);
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                Uri uri=request.getUrl();
                String p=uri.getPath();
                if(!HOST.equals(uri.getHost()) || !"https".equals(uri.getScheme()) || p==null || !p.startsWith("/") || p.contains(".."))return missing();
                String ext=p.substring(p.lastIndexOf('.')+1);
                String mime;
                switch(ext){
                    case "js":mime="text/javascript";break;
                    case "html":mime="text/html";break;
                    case "css":mime="text/css";break;
                    case "wasm":mime="application/wasm";break;
                    case "ttf":mime="font/ttf";break;
                    case "png":case "webp":case "bmp":mime="image/"+ext;break;
                    default:mime="application/octet-stream";
                }
                try{return new WebResourceResponse(mime,mime.startsWith("text/")?"UTF-8":null,getAssets().open("web"+p));}
                catch(IOException ex){return missing();}
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri dest=request.getUrl();
                if("https".equals(dest.getScheme()) && HOST.equals(dest.getHost()))return false;
                if(request.hasGesture() && ("https://gametranslate.us/".equals(dest.toString()) || "https://github.com/irori/np2-wasm".equals(dest.toString())))
                    startActivity(new Intent(Intent.ACTION_VIEW,dest));
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView w,ValueCallback<Uri[]> cb,FileChooserParams params){
                if(pending!=null)pending.onReceiveValue(null);
                pending=cb;
                Intent pick=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE);
                try{startActivityForResult(pick,PICK);}catch(android.content.ActivityNotFoundException ex){pending=null;cb.onReceiveValue(null);}
                return true;
            }
            @Override public void onShowCustomView(View view,CustomViewCallback cb){
                if(full!=null){cb.onCustomViewHidden();return;}
                full=view;endFull=cb;root.addView(full,new FrameLayout.LayoutParams(-1,-1));
                getWindow().getDecorView().setSystemUiVisibility(5894);root.requestApplyInsets();
            }
            @Override public void onHideCustomView(){leaveFull();}
        });
        web.loadUrl("https://"+HOST+"/index.html");
    }
    private static WebResourceResponse missing(){
        return new WebResourceResponse("text/plain","UTF-8",404,"Not found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));
    }
    private void leaveFull(){
        if(full==null)return;
        root.removeView(full);full=null;
        getWindow().getDecorView().setSystemUiVisibility(0);endFull.onCustomViewHidden();endFull=null;root.requestApplyInsets();
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request!=PICK || pending==null)return;
        List<Uri> selected=new ArrayList<>();
        if(result==RESULT_OK && data!=null){
            if(data.getClipData()!=null)for(int i=0;i<data.getClipData().getItemCount();i++)selected.add(data.getClipData().getItemAt(i).getUri());
            else if(data.getData()!=null)selected.add(data.getData());
        }
        pending.onReceiveValue(selected.isEmpty()?null:selected.toArray(new Uri[0]));pending=null;
    }
    @Override public void onBackPressed(){
        if(full!=null){leaveFull();return;}
        web.evaluateJavascript("(()=>{if(document.querySelector('dialog[open]')){document.querySelector('dialog[open]').close();return true}const b=document.querySelector('[data-act=to-library]');if(b){b.click();return true}return false})()",value->{if(!"true".equals(value))super.onBackPressed();});
    }
    @Override protected void onDestroy(){if(pending!=null)pending.onReceiveValue(null);root.removeView(web);web.destroy();super.onDestroy();}
}
