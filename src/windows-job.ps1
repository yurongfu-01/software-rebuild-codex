param(
    [Parameter(Mandatory=$true)][string]$Executable,
    [Parameter(Mandatory=$true)][string]$EncodedArgs
)
$ErrorActionPreference = 'Stop'
# Only fixed host-configured executables are launched. Arguments are data, never code.
$nativeSource = @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class RebuildJob {
  [StructLayout(LayoutKind.Sequential)] struct BasicLimits {
    public long PerProcessUserTimeLimit, PerJobUserTimeLimit;
    public uint LimitFlags;
    public UIntPtr MinimumWorkingSetSize, MaximumWorkingSetSize;
    public uint ActiveProcessLimit;
    public UIntPtr Affinity;
    public uint PriorityClass, SchedulingClass;
  }
  [StructLayout(LayoutKind.Sequential)] struct IoCounters { public ulong ReadOperationCount, WriteOperationCount, OtherOperationCount, ReadTransferCount, WriteTransferCount, OtherTransferCount; }
  [StructLayout(LayoutKind.Sequential)] struct ExtendedLimits {
    public BasicLimits BasicLimitInformation;
    public IoCounters IoInfo;
    public UIntPtr ProcessMemoryLimit, JobMemoryLimit, PeakProcessMemoryUsed, PeakJobMemoryUsed;
  }
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] struct Startup {
    public int cb; public string reserved, desktop, title;
    public uint x, y, xSize, ySize, xCountChars, yCountChars, fillAttribute, flags;
    public short showWindow, reserved2Length; public IntPtr reserved2, stdin, stdout, stderr;
  }
  [StructLayout(LayoutKind.Sequential)] struct ProcessInfo { public IntPtr process, thread; public uint processId, threadId; }
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr attributes, string name);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job, int infoClass, ref ExtendedLimits info, uint size);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] static extern bool CreateProcess(string app, StringBuilder commandLine, IntPtr processAttributes, IntPtr threadAttributes, bool inheritHandles, uint flags, IntPtr environment, string directory, ref Startup startup, out ProcessInfo process);
  [DllImport("kernel32.dll")] static extern IntPtr GetStdHandle(int which);
  [DllImport("kernel32.dll")] static extern IntPtr GetCurrentProcess();
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool DuplicateHandle(IntPtr sourceProcess, IntPtr source, IntPtr targetProcess, out IntPtr target, uint access, bool inherit, uint options);
  [DllImport("kernel32.dll")] static extern uint ResumeThread(IntPtr thread);
  [DllImport("kernel32.dll")] static extern uint WaitForSingleObject(IntPtr handle, uint ms);
  [DllImport("kernel32.dll")] static extern bool GetExitCodeProcess(IntPtr process, out uint code);
  [DllImport("kernel32.dll")] static extern bool TerminateProcess(IntPtr process, uint code);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
  static string Quote(string value) {
    StringBuilder b = new StringBuilder("\""); int slashes = 0;
    foreach (char c in value) {
      if (c == '\\') { slashes++; continue; }
      if (c == '"') { b.Append('\\', slashes * 2 + 1); b.Append(c); }
      else { b.Append('\\', slashes); b.Append(c); }
      slashes = 0;
    }
    b.Append('\\', slashes * 2); b.Append('"'); return b.ToString();
  }
  static IntPtr Inherit(int which) {
    IntPtr copy;
    if (!DuplicateHandle(GetCurrentProcess(), GetStdHandle(which), GetCurrentProcess(), out copy, 0, true, 2)) throw new Exception("stdio inheritance failed");
    return copy;
  }
  public static int Run(string exe, string[] args) {
    IntPtr job = CreateJobObject(IntPtr.Zero, null); ProcessInfo pi = new ProcessInfo();
    Startup si = new Startup();
    try {
      if (job == IntPtr.Zero) throw new Exception("Job creation failed");
      ExtendedLimits limits = new ExtendedLimits(); limits.BasicLimitInformation.LimitFlags = 0x2000;
      if (!SetInformationJobObject(job, 9, ref limits, (uint)Marshal.SizeOf(typeof(ExtendedLimits)))) throw new Exception("Job limits failed");
      si.cb = Marshal.SizeOf(typeof(Startup)); si.flags = 0x100; si.stdin = Inherit(-10); si.stdout = Inherit(-11); si.stderr = Inherit(-12);
      StringBuilder cmd = new StringBuilder(Quote(exe)); foreach (string arg in args) { cmd.Append(' '); cmd.Append(Quote(arg)); }
      // Suspend before assignment: descendants cannot escape during setup.
      if (!CreateProcess(null, cmd, IntPtr.Zero, IntPtr.Zero, true, 0x08000004, IntPtr.Zero, null, ref si, out pi)) throw new Exception("Process creation failed: " + Marshal.GetLastWin32Error());
      if (!AssignProcessToJobObject(job, pi.process)) { TerminateProcess(pi.process, 1); throw new Exception("Job assignment failed"); }
      if (ResumeThread(pi.thread) == 0xffffffff) { TerminateProcess(pi.process, 1); throw new Exception("Process resume failed"); }
      WaitForSingleObject(pi.process, 0xffffffff); uint code; GetExitCodeProcess(pi.process, out code); return unchecked((int)code);
    } finally {
      // Closing the sole job handle kills remaining descendants even if the target exited.
      if (job != IntPtr.Zero) CloseHandle(job);
      if (pi.thread != IntPtr.Zero) CloseHandle(pi.thread); if (pi.process != IntPtr.Zero) CloseHandle(pi.process);
      if (si.stdin != IntPtr.Zero) CloseHandle(si.stdin); if (si.stdout != IntPtr.Zero) CloseHandle(si.stdout); if (si.stderr != IntPtr.Zero) CloseHandle(si.stderr);
    }
  }
}
'@
try {
    Add-Type -TypeDefinition $nativeSource -ErrorAction Stop
    $json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($EncodedArgs))
    $parsedArgs = ConvertFrom-Json -InputObject $json
    [string[]]$nativeArgs = @()
    foreach ($argItem in $parsedArgs) { $nativeArgs += [string]$argItem }
    exit [RebuildJob]::Run($Executable, $nativeArgs)
} catch {
    [Console]::Error.WriteLine('Windows job launcher failed; verify PowerShell and Job Object support.')
    exit 125
}
