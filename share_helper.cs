using System;
using System.Runtime.InteropServices;
using System.IO;
using System.Threading;
using System.Collections.Generic;
using Windows.ApplicationModel.DataTransfer;
using Windows.Storage;

class Program
{
    [ComImport]
    [Guid("3A3DCD6C-3EAB-43DC-BCDE-567677D43D1A")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IDataTransferManagerInterop
    {
        IntPtr GetForWindow([In] IntPtr appWindow, [In] ref Guid riid);
        void ShowShareUIForWindow([In] IntPtr appWindow);
    }

    static readonly Guid IID_IDataTransferManager = new Guid("5A5AB88B-2628-450F-85D4-B9F52CA32F90");

    [STAThread]
    static void Main(string[] args)
    {
        if (args.Length < 2)
        {
            Console.WriteLine("Usage: share_helper.exe <HWND> <FilePath> [Title]");
            return;
        }

        try
        {
            string hwndStr = args[0];
            string filePath = Path.GetFullPath(args[1]);
            string title = args.Length > 2 ? args[2] : "عرض سعر";

            IntPtr hwnd;
            if (hwndStr.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
            {
                hwnd = new IntPtr(Convert.ToInt64(hwndStr.Substring(2), 16));
            }
            else
            {
                hwnd = new IntPtr(Convert.ToInt64(hwndStr));
            }

            if (!File.Exists(filePath))
            {
                Console.WriteLine("Error: File not found: " + filePath);
                return;
            }

            ShowShare(hwnd, filePath, title);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Exception: " + ex.ToString());
        }
    }

    static void ShowShare(IntPtr hwnd, string filePath, string title)
    {
        // Get the Interop constructor
        IDataTransferManagerInterop interop = (IDataTransferManagerInterop)System.Runtime.InteropServices.WindowsRuntime.WindowsRuntimeMarshal.GetActivationFactory(typeof(DataTransferManager));
        
        IntPtr dtmPtr = interop.GetForWindow(hwnd, ref IID_IDataTransferManager);
        DataTransferManager dtm = (DataTransferManager)Marshal.GetObjectForIUnknown(dtmPtr);

        dtm.DataRequested += (sender, e) =>
        {
            DataRequest request = e.Request;
            request.Data.Properties.Title = title;
            request.Data.Properties.Description = "مستند من باركود ماستر";

            // Get StorageFile
            var op = StorageFile.GetFileFromPathAsync(filePath);
            while (op.Status == Windows.Foundation.AsyncStatus.Started)
            {
                Thread.Sleep(20);
            }
            if (op.Status == Windows.Foundation.AsyncStatus.Completed)
            {
                StorageFile storageFile = op.GetResults();
                var items = new List<IStorageItem> { storageFile };
                request.Data.SetStorageItems(items);
            }
            else
            {
                Console.WriteLine("Error: Async operation failed with status: " + op.Status);
            }
        };

        interop.ShowShareUIForWindow(hwnd);
        
        // Wait briefly for the sharing operation to initiate
        Thread.Sleep(1200);
    }
}
