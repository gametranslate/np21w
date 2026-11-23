using System;
using System.Text;
using System.Drawing;
using System.Windows.Forms;
using System.Runtime.InteropServices;

namespace NekoStation {
    // NP21/W owns the pixels and keyboard input. The host owns the viewport.
    internal sealed class PlaySurface : Panel, IMessageFilter {
        const int GwlStyle=-16, GwlExStyle=-20;
        const int Child=0x40000000, Caption=0xc00000, Frame=0x40000, SystemMenu=0x80000;
        const int Popup=unchecked((int)0x80000000);
        IntPtr game;
        int scaleLimit, sentScale;
        Rectangle viewport;
        bool needsFocus;
        internal bool Expand {get;set;}
        internal Func<int,bool,bool,bool> GameKey;
        readonly System.Collections.Generic.Dictionary<int,IntPtr> held=new System.Collections.Generic.Dictionary<int,IntPtr>();
        IntPtr focusHook;
        Win.Foreground focusEvent;
        [DllImport("user32",SetLastError=true)] static extern IntPtr SetParent(IntPtr child, IntPtr parent);
        [DllImport("user32")] static extern IntPtr GetParent(IntPtr child);
        [DllImport("user32",EntryPoint="GetWindowLongW")] static extern int GetStyle(IntPtr hwnd,int index);
        [DllImport("user32",EntryPoint="SetWindowLongW")] static extern int SetStyle(IntPtr hwnd,int index,int value);
        [DllImport("user32")] static extern bool SetWindowPos(IntPtr hwnd,IntPtr after,int x,int y,int w,int h,uint flags);
        [DllImport("user32")] static extern bool ShowWindow(IntPtr hwnd,int cmd);
        [DllImport("user32")] static extern IntPtr SetFocus(IntPtr hwnd);
        [DllImport("user32")] static extern bool GetWindowRect(IntPtr hwnd,out NativeRect rect);
        [DllImport("user32")] static extern bool ScreenToClient(IntPtr hwnd,ref Point pt);
        [DllImport("user32")] static extern bool GetGUIThreadInfo(uint thread,ref GuiInfo info);
        [StructLayout(LayoutKind.Sequential)] struct NativeRect { public int Left,Top,Right,Bottom; }
        [StructLayout(LayoutKind.Sequential)] struct GuiInfo {
            public int size,flags;
            public IntPtr active,focus,capture,menu,move,caret;
            public NativeRect caretRect;
        }
        internal PlaySurface(){
            BackColor=Color.Black;Visible=false;TabStop=false;
            SetStyle(ControlStyles.Selectable,true);
            Application.AddMessageFilter(this);
            LostFocus+=(s,e)=>ReleaseInput();
        }
        internal void Attach(IntPtr hwnd,int scale,int pid) {
            Hide();game=hwnd;scaleLimit=scale;sentScale=scale;needsFocus=true;
            SetStyle(game,GwlStyle,(GetStyle(game,GwlStyle)&~(Popup|Caption|Frame|SystemMenu|0x30000))|Child);
            SetStyle(game,GwlExStyle,GetStyle(game,GwlExStyle)&~0x40000);
            SetParent(game,Handle);
            if(GetParent(game)!=Handle)throw new AppError("startFail");
            SetWindowPos(game,IntPtr.Zero,0,0,0,0,0x37);
            ShowWindow(game,5);
            // A mouse click still reaches NP21/W. Keep subsequent keyboard messages on our own control.
            focusEvent=(h,e,w,o,c,t,ms)=>{
                if(w==game && Visible && Win.GetForegroundWindow()==FindForm().Handle && HasGameFocus())FocusGame();
            };
            focusHook=Win.SetWinEventHook(0x8005,0x8005,IntPtr.Zero,focusEvent,(uint)pid,0,0);
        }
        internal void Place(Rectangle bounds){
            if(game==IntPtr.Zero)return;
            viewport=bounds;
            var visible=Rectangle.Intersect(Parent.ClientRectangle,bounds);
            if(visible.Width<1||visible.Height<1){Hide();return;}
            Bounds=visible;
            bool justShown=!Visible;
            if(justShown){Show();BringToFront();}
            Align();
            if(needsFocus||justShown){needsFocus=false;FocusGame();}
        }
        internal void Align(){
            if(game==IntPtr.Zero||!Visible)return;
            int fit=Math.Min(viewport.Width/80,viewport.Height/50);
            int chosen=Math.Max(1,Math.Min(Expand?50:scaleLimit,fit));
            if(chosen!=sentScale){sentScale=chosen;Win.PostMessage(game,0x112,new IntPtr(40050+chosen),IntPtr.Zero);}
            NativeRect r;if(!GetWindowRect(game,out r))return;
            int x=viewport.Left-Left+(viewport.Width-r.Right+r.Left)/2;
            int y=viewport.Top-Top+(viewport.Height-r.Bottom+r.Top)/2;
            var pt=new Point(r.Left,r.Top);
            ScreenToClient(Handle,ref pt);
            if(pt.X!=x||pt.Y!=y)SetWindowPos(game,IntPtr.Zero,x,y,0,0,0x15);
        }
        internal bool HasGameFocus(){
            if(!Visible||game==IntPtr.Zero)return false;
            var info=new GuiInfo{size=Marshal.SizeOf(typeof(GuiInfo))};
            return GetGUIThreadInfo(0,ref info)&&info.focus==game;
        }
        internal void FocusGame(){if(Visible&&game!=IntPtr.Zero)Focus();}
        public bool PreFilterMessage(ref Message m){
            if(game==IntPtr.Zero||!Visible||m.HWnd!=Handle)return false;
            if(m.Msg!=0x100&&m.Msg!=0x101&&m.Msg!=0x104&&m.Msg!=0x105)return false;
            int key=m.WParam.ToInt32();
            bool down=m.Msg==0x100||m.Msg==0x104;
            bool alt=(m.LParam.ToInt64()&(1L<<29))!=0;
            if(alt&&key==(int)Keys.F4)return false;
            bool repeat=(m.LParam.ToInt64()&(1L<<30))!=0;
            if(down && GameKey!=null && GameKey(key,alt,!repeat))return true;
            if(!down && !held.ContainsKey(key))return true;
            if(down)held[key]=m.LParam;else held.Remove(key);
            Win.PostMessage(game,m.Msg,m.WParam,m.LParam);
            return true;
        }
        void ReleaseInput(){
            foreach(var pair in held)Win.PostMessage(game,0x101,new IntPtr(pair.Key),new IntPtr(pair.Value.ToInt64()|0xC0000000L));
            held.Clear();
        }
        internal void Clear(){
            if(focusHook!=IntPtr.Zero){Win.UnhookWinEvent(focusHook);focusHook=IntPtr.Zero;}
            ReleaseInput();Hide();game=IntPtr.Zero;viewport=Rectangle.Empty;
        }
        protected override void Dispose(bool disposing){
            if(disposing){Application.RemoveMessageFilter(this);Clear();}
            base.Dispose(disposing);
        }
    }
}

