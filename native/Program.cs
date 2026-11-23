using System;
using System.IO;
using System.Linq;
using System.Drawing;
using System.Diagnostics;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Web.Script.Serialization;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace NekoStation {
    internal static class Program {
        [STAThread]
        static void Main() {
            bool first;
            using (var mutex = new Mutex(true, @"Local\NekoStation.Desktop.v1", out first)) {
                if (!first) {
                    using (var self = Process.GetCurrentProcess())
                    foreach (var other in Process.GetProcessesByName(self.ProcessName))
                        using (other) if (other.Id != self.Id && other.MainWindowHandle != IntPtr.Zero)
                            Win.Focus(other.MainWindowHandle);
                    return;
                }
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new Launcher());
            }
        }
    }

    internal sealed class Request {
        public int id {get;set;}
        public string op {get;set;}
        public string game {get;set;}
        public string[] paths {get;set;}
        public string command {get;set;}
        public int x {get;set;}
        public int y {get;set;}
        public int width {get;set;}
        public int height {get;set;}
        public string exitLabel {get;set;}
        public CoreSettings settings {get;set;}
    }

    internal sealed class Launcher : Form {
        const string Home = "https://nekostation.invalid/index.html";
        internal static readonly string Root = AppDomain.CurrentDomain.BaseDirectory;
        internal static readonly string Data = Environment.GetEnvironmentVariable("NEKOSTATION_DATA_DIR") ??
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NekoStation");
        readonly WebView2 web = new WebView2();
        internal readonly PlaySurface Surface = new PlaySurface();
        readonly JavaScriptSerializer json = new JavaScriptSerializer();
        readonly GameSession session;
        readonly Button leaveFull = new Button();
        internal bool FullScreen {get;private set;}
        Rectangle normalBounds,lastSurface;
        FormWindowState normalState;
        FormBorderStyle normalBorder;
        DateTime showExitUntil;
        bool closing;
        public Launcher() {
            Text = "NekoStation";
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            Size = new Size(1280,840); MinimumSize = new Size(720,510);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Color.FromArgb(17,20,23);
            web.DefaultBackgroundColor=BackColor;
            web.Dock=DockStyle.Fill; Controls.Add(web);
            Controls.Add(Surface);
            leaveFull.AutoSize=true;leaveFull.Visible=false;
            leaveFull.FlatStyle=FlatStyle.Flat;leaveFull.BackColor=Color.FromArgb(32,39,35);
            leaveFull.ForeColor=Color.White;leaveFull.Padding=new Padding(9,4,9,4);
            leaveFull.Click+=(s,e)=>SetFullScreen(false);
            Controls.Add(leaveFull);
            session=new GameSession(this);
            Shown += async delegate { await Initialize(); };
            FormClosing += delegate(object sender, FormClosingEventArgs e) {
                if (session.Running) { e.Cancel=true; closing=true; session.CloseGame(); }
            };
            FormClosed += delegate { session.Dispose(); };
        }
        async Task Initialize() {
            try {
                Directory.CreateDirectory(Data);
                var env=await CoreWebView2Environment.CreateAsync(null,Path.Combine(Data,"WebView"),null);
                await web.EnsureCoreWebView2Async(env);
                var browser=web.CoreWebView2;
                browser.SetVirtualHostNameToFolderMapping("nekostation.invalid",Root,CoreWebView2HostResourceAccessKind.DenyCors);
                browser.Settings.AreHostObjectsAllowed=false;
                browser.Settings.AreDefaultContextMenusEnabled=false;
                browser.Settings.IsStatusBarEnabled=false;
                browser.Settings.AreBrowserAcceleratorKeysEnabled=false;
                browser.NavigationStarting += (o,e)=>{ if (e.Uri!=Home) e.Cancel=true; };
                browser.NewWindowRequested += (o,e)=>{
                    e.Handled=true;
                    if(e.Uri=="https://gametranslate.us/" || e.Uri=="https://github.com/SimK98/np21w")
                        Process.Start(new ProcessStartInfo(e.Uri){ UseShellExecute=true });
                };
                browser.WebMessageReceived += OnMessage;
                browser.Navigate(Home);
            } catch(Exception e) {
                MessageBox.Show("NekoStation requires Microsoft Edge WebView2 Runtime.\n\n"+e.Message,Text);
                Close();
            }
        }
        void Send(object payload) {
            if(!IsDisposed && web.CoreWebView2!=null) web.CoreWebView2.PostWebMessageAsJson(json.Serialize(payload));
        }
        internal void Signal(string name,string detail="") {
            if(name=="ended" && FullScreen)SetFullScreen(false);
            Send(new {eventName=name,detail=detail});
            if(name=="ended" && closing) BeginInvoke(new Action(Close));
        }
        async void OnMessage(object sender,CoreWebView2WebMessageReceivedEventArgs e) {
            if(e.Source!=Home)return;
            Request r=null;
            try {
                r=json.Deserialize<Request>(e.WebMessageAsJson);
                object result=null;
                switch(r.op) {
                    case "pick":
                        using(var dlg=new OpenFileDialog { Multiselect=true, Filter="PC-98 (*.hdi, *.nhd, *.d88, *.fdi)|*.hdi;*.nhd;*.d88;*.fdi", RestoreDirectory=true }) {
                            result=dlg.ShowDialog(this)==DialogResult.OK?dlg.FileNames:new string[0];
                        }
                        break;
                    case "drop":
                        result=e.AdditionalObjects.OfType<CoreWebView2File>().Select(f=>f.Path).ToArray();break;
                    case "launch":
                        leaveFull.Text=r.exitLabel+"   F11";
                        await session.Start(r.game,r.paths,r.settings);break;
                    case "control":
                        session.Command(r.command);break;
                    case "surface":
                        lastSurface=new Rectangle(r.x,r.y,r.width,r.height);
                        Surface.Place(FullScreen?ClientRectangle:lastSurface);break;
                    case "fullscreen":
                        if(!session.Running || !Surface.Visible)throw new AppError("ended");
                        leaveFull.Text=r.exitLabel+"   F11";
                        SetFullScreen(!FullScreen);break;
                    default:throw new AppError("error");
                }
                Send(new {id=r.id,result=result});
            } catch(Exception ex) {
                Send(new {id=r==null?0:r.id,error=ex is AppError?ex.Message:"error",detail=ex is AppError?"":ex.Message});
            }
        }
        internal void SetFullScreen(bool show){
            if(show==FullScreen)return;
            FullScreen=show;Surface.Expand=show;
            if(show){
                Rectangle monitor=Screen.FromControl(this).Bounds;
                normalState=WindowState;
                normalBounds=normalState==FormWindowState.Normal?Bounds:RestoreBounds;
                normalBorder=FormBorderStyle;
                WindowState=FormWindowState.Normal;
                FormBorderStyle=FormBorderStyle.None;
                Bounds=monitor;
                showExitUntil=DateTime.UtcNow.AddSeconds(3);
                Surface.Place(ClientRectangle);
                RefreshFullScreenControls();
            }else{
                leaveFull.Hide();
                FormBorderStyle=normalBorder;
                Bounds=normalBounds;WindowState=normalState;
                Surface.Place(lastSurface);
            }
            Surface.FocusGame();
        }
        internal void RefreshFullScreenControls(){
            if(!FullScreen)return;
            var point=PointToClient(Cursor.Position);
            bool reveal=DateTime.UtcNow<showExitUntil || (ClientRectangle.Contains(point)&&point.Y<70);
            leaveFull.Location=new Point(ClientSize.Width-leaveFull.Width-14,12);
            if(reveal!=leaveFull.Visible){
                leaveFull.Visible=reveal;
                if(reveal)leaveFull.BringToFront();
            }
        }
    }
    internal class AppError : Exception {public AppError(string key):base(key){}}
}

