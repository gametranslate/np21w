using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Drawing;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NekoStation {
    internal sealed class CoreSettings {
        public int volume {get;set;}
        public bool scan {get;set;}
        public int scale {get;set;}
        public int cpu {get;set;}
        public int ram {get;set;}
        public string sound {get;set;}
        public int slot {get;set;}
        public bool keypad {get;set;}
        public Dictionary<string,string> keys {get;set;}
    }

    internal static class Win {
        [DllImport("user32")] internal static extern IntPtr GetForegroundWindow();
        [DllImport("user32")] internal static extern bool SetForegroundWindow(IntPtr hwnd);
        [DllImport("user32")] static extern bool IsIconic(IntPtr hwnd);
        [DllImport("user32")] static extern bool ShowWindow(IntPtr hwnd,int command);
        internal static void Focus(IntPtr hwnd){if(IsIconic(hwnd))ShowWindow(hwnd,9);SetForegroundWindow(hwnd);}
        [DllImport("user32")] internal static extern bool PostMessage(IntPtr hwnd,int msg,IntPtr w,IntPtr l);
        internal delegate void Foreground(IntPtr hook,uint evt,IntPtr hwnd,int obj,int child,uint thread,uint time);
        [DllImport("user32")] internal static extern IntPtr SetWinEventHook(uint min,uint max,IntPtr dll,Foreground cb,uint pid,uint thread,uint flags);
        [DllImport("user32")] internal static extern bool UnhookWinEvent(IntPtr hook);
        [DllImport("kernel32",CharSet=CharSet.Unicode,SetLastError=true)]
        internal static extern bool WritePrivateProfileString(string section,string key,string val,string file);
    }

    internal sealed class GameSession : IDisposable {
        static readonly string[] Actions={"save","load","fast","pause"};
        static readonly int[] Commands={40201,40251,40508,40110};
        static readonly string[] Movement={"up","down","left","right","a","b","confirm","space"};
        static readonly string[] Targets={"UP","DOWN","LEFT","RIGHT","Z","X","ENTER","SPC"};
        static readonly string[] Numpad={"[8]","[2]","[4]","[6]"};
        readonly Launcher owner;
        readonly Timer timer=new Timer{Interval=300};
        Process process; CoreSettings config; string ini;
        IntPtr hwnd; bool launching;
        public bool Running { get{return process!=null && !process.HasExited;} }
        public GameSession(Launcher owner) {
            this.owner=owner;
            owner.Surface.GameKey=HandleGameKey;
            timer.Tick+=(s,e)=>Poll();
        }
        static string KeyName(string key) {
            if(key=="Space")return "SPC";
            if(key=="Enter")return "ENTER";
            if(key=="Tab")return "TAB";
            if(key=="Backspace")return "BS";
            if(new[]{"Up","Down","Left","Right"}.Contains(key))return key.ToUpperInvariant();
            if(key.Length==1 && ((key[0]>='A'&&key[0]<='Z')||(key[0]>='0'&&key[0]<='9')))return key;
            if(key.Length==4 && key.StartsWith("Num") && Char.IsDigit(key[3]))return "["+key[3]+"]";
            int f;
            if(key.StartsWith("F") && int.TryParse(key.Substring(1),out f) && f>=1 && f<=10)return key;
            throw new AppError("badKey");
        }
        static uint VirtualKey(string key) {
            if(key=="Backspace")return (uint)Keys.Back;
            if(key.Length==1)return key[0];
            if(key.StartsWith("Num"))return (uint)(96+key[3]-'0');
            if(key.StartsWith("F"))return (uint)(111+int.Parse(key.Substring(1)));
            return (uint)(Keys)Enum.Parse(typeof(Keys),key);
        }
        static int OneOf(int n,params int[] choices) {
            if(!choices.Contains(n))throw new AppError("error");return n;
        }
        void Set(string key,object value) {
            if(!Win.WritePrivateProfileString("NekoProject21",key,Convert.ToString(value,System.Globalization.CultureInfo.InvariantCulture),ini))
                throw new IOException("NP21/W profile");
        }
        public async Task Start(string game,string[] paths,CoreSettings settings) {
            if(launching||Running)throw new AppError("busy");
            if(process!=null)Finish();
            launching=true;
            try {
                if(string.IsNullOrEmpty(game)||paths==null||paths.Length==0||settings==null)throw new AppError("missing");
                foreach(string file in paths){
                    if(!Path.IsPathRooted(file)||!File.Exists(file))throw new AppError("missing");
                    string ext=Path.GetExtension(file).ToLowerInvariant();
                    if(!new[]{".hdi",".nhd",".d88",".fdi"}.Contains(ext))throw new AppError("format");
                    if(file.Length>=259)throw new AppError("longPath");
                }
                config=settings;
                if(config.keys==null||config.keys.Values.Distinct().Count()!=config.keys.Count)throw new AppError("conflict");
                foreach(string id in Movement.Concat(Actions)) {
                    if(!config.keys.ContainsKey(id))throw new AppError("badKey");
                    KeyName(config.keys[id]);
                }
                string profile;
                using(var hash=SHA256.Create())
                    profile=BitConverter.ToString(hash.ComputeHash(Encoding.UTF8.GetBytes(game))).Replace("-","").Substring(0,24);
                string folder=Path.Combine(Launcher.Data,"Games",profile);
                Directory.CreateDirectory(folder);ini=Path.Combine(folder,"game.ini");
                if(!File.Exists(ini))File.WriteAllText(ini,"[NekoProject21]\r\n",Encoding.Unicode);
                if(config.slot<0||config.slot>9||config.volume<0||config.volume>100)throw new AppError("error");
                Set("volume_M",config.volume);Set("skipline",config.scan?"true":"false");Set("skplight",128);
                Set("SVSCRMUL","true");Set("SCRN_MUL",OneOf(config.scale,8,12,16));
                Set("clk_base",2457600);Set("clk_mult",OneOf(config.cpu,4,8,16,20,32,42));
                Set("ExMemory",OneOf(config.ram,3,7,13,31,63));
                if(!new[]{"2","4","6"}.Contains(config.sound))throw new AppError("error");
                Set("SNDboard",config.sound);Set("STATSAVE","true");Set("s_NOWAIT","false");
                Set("e_resume","false");Set("DRAGDROP","true");Set("SVFDFILE","true");
                Set("windtype",2);Set("backgrnd",0);Set("toolwind","false");
                Set("biospath",folder);Set("keyboard","101");Set("F12_COPY",0);
                var mappings=Movement.Select((id,i)=>KeyName(config.keys[id])+"="+(config.keypad&&i<4?Numpad[i]:Targets[i]));
                File.WriteAllLines(Path.Combine(folder,"key.txt"),mappings,Encoding.ASCII);
                var hard=paths.Where(p=>new[]{".nhd",".hdi"}.Contains(Path.GetExtension(p).ToLowerInvariant())).ToArray();
                var floppy=paths.Except(hard).ToArray();
                for(int i=0;i<4;i++) {
                    Set("HDD"+(i+1)+"FILE",i<hard.Length?hard[i]:"");
                    Set("FDD"+(i+1)+"FILE",i<Math.Min(2,floppy.Length)?floppy[i]:"");
                }
                Set("IDE1TYPE",1);
                string core=Path.Combine(Launcher.Root,"core","np21x64w.exe");
                if(!File.Exists(core))throw new AppError("noCore");
                process=Process.Start(new ProcessStartInfo(core,"\""+ini+"\""){
                    WorkingDirectory=Path.GetDirectoryName(core),UseShellExecute=false,WindowStyle=ProcessWindowStyle.Hidden
                });
                for(int n=0;n<100;n++) {
                    if(process.HasExited)throw new AppError("startFail");
                    hwnd=FindGameWindow(process.Id);
                    if(hwnd!=IntPtr.Zero)break;
                    await Task.Delay(40);
                }
                if(hwnd==IntPtr.Zero)throw new AppError("startFail");
                owner.Surface.Attach(hwnd,config.scale,process.Id);
                timer.Start();
            } catch {
                if(Running){CloseGame();timer.Start();}
                else if(process!=null)Finish();
                throw;
            } finally {launching=false;}
        }
        [DllImport("user32",CharSet=CharSet.Unicode)] static extern int GetClassName(IntPtr window,StringBuilder name,int n);
        delegate bool Enumerate(IntPtr window,IntPtr data);
        [DllImport("user32")] static extern bool EnumWindows(Enumerate callback,IntPtr data);
        [DllImport("user32")] static extern uint GetWindowThreadProcessId(IntPtr window,out int pid);
        static IntPtr FindGameWindow(int pid){
            IntPtr found=IntPtr.Zero;
            EnumWindows(delegate(IntPtr w,IntPtr ignored){
                int ownerPid;GetWindowThreadProcessId(w,out ownerPid);
                if(ownerPid!=pid)return true;
                var name=new StringBuilder(120);GetClassName(w,name,name.Capacity);
                if(!name.ToString().EndsWith("-MainWindow",StringComparison.Ordinal))return true;
                found=w;return false;
            },IntPtr.Zero);
            return found;
        }
        bool HandleGameKey(int key,bool alt,bool first){
            if(key==(int)Keys.F11 || (alt&&key==(int)Keys.Enter)){
                if(first)owner.SetFullScreen(!owner.FullScreen);
                return true;
            }
            string action=Actions.FirstOrDefault(a=>VirtualKey(config.keys[a])==key);
            if(action==null)return false;
            if(first)try{Command(action);}catch(AppError e){owner.Signal("message",e.Message);}
            return true;
        }
        public void Command(string name) {
            if(!Running||hwnd==IntPtr.Zero)throw new AppError("ended");
            if(name=="focus"){owner.Surface.FocusGame();return;}
            if(name=="close"){CloseGame();return;}
            int index=Array.IndexOf(Actions,name);
            int command;
            if(index>=0){
                if(name=="load"&&!File.Exists(Path.ChangeExtension(ini,"S"+config.slot.ToString("00"))))throw new AppError("noState");
                command=Commands[index]+(index<2?config.slot:0);
            }else if(name=="disk1"||name=="disk2"){command=name=="disk1"?40301:40302;owner.Surface.FocusGame();}
            else throw new AppError("error");
            if(!Win.PostMessage(hwnd,0x111,new IntPtr(command),IntPtr.Zero))throw new AppError("error");
            if(index>=0)owner.Surface.FocusGame();
        }
        public void CloseGame(){
            if(!Running)return;
            if(hwnd==IntPtr.Zero)hwnd=FindGameWindow(process.Id);
            if(hwnd!=IntPtr.Zero)Win.PostMessage(hwnd,0x10,IntPtr.Zero,IntPtr.Zero);
        }
        void Poll(){if(process==null||process.HasExited){Finish();return;}owner.Surface.Align();owner.RefreshFullScreenControls();}
        void Finish(){
            timer.Stop();hwnd=IntPtr.Zero;owner.Surface.Clear();
            if(process!=null){process.Dispose();process=null;}
            owner.Signal("ended");
        }
        public void Dispose(){timer.Stop();timer.Dispose();if(process!=null)process.Dispose();}
    }
}

