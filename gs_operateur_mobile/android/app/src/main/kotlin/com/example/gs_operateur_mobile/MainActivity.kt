package com.example.gs_operateur_mobile

import android.content.Context
import android.os.Build
import dalvik.system.DexClassLoader
import dalvik.system.InMemoryDexClassLoader
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.io.FileOutputStream
import java.lang.reflect.Method
import java.nio.ByteBuffer
import java.util.zip.ZipFile

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.example.gs_operateur/printer"
    private var serviceClassLoader: ClassLoader? = null
    private var thermalPrinterClass: Class<*>? = null
    private var printerInstance: Any? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        try { initTelpoSDK() } catch (_: Exception) { _scanLog = listOf("FAIL: init crashed") }

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "scanPrinter" -> result.success(scanForPrinter())
                "printText" -> {
                    val text = call.argument<String>("text") ?: ""
                    _qrUrl = call.argument<String>("qrUrl")
                    try {
                        printViaSDK(text)
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("SDK_PRINT_ERROR", e.message, e.stackTraceToString())
                    }
                }
                "printRaw" -> {
                    try {
                        val text = call.argument<String>("text")
                        val data = call.argument<ByteArray>("data")
                        when {
                            data != null -> printRawBytes(data)
                            text != null -> printRawBytes(text.toByteArray(Charsets.US_ASCII))
                            else -> result.error("PRINT_ERROR", "No text or data", null)
                        }
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("PRINT_ERROR", e.message, null)
                    }
                }
                "printQrCode" -> {
                    val data = call.argument<String>("data") ?: ""
                    try {
                        printQrCodeEscPos(data)
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("QR_ERROR", e.message, null)
                    }
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun loadClassesFromApk(apkPath: String, log: MutableList<String>): ClassLoader? {
        val classNames = listOf(
            "com.common.apiutil.printer.ThermalPrinter",
            "com.common.apiutil.printer.NewUsbThermalPrinter",
            "com.common.apiutil.printer.UsbThermalPrinter",
            "com.telpo.tps550.api.printer.ThermalPrinter",
            "com.telpo.tps550.api.printer.UsbThermalPrinter"
        )

        // Method A: InMemoryDexClassLoader — load all DEX from APK zip in memory
        if (Build.VERSION.SDK_INT >= 26) {
            try {
                val zip = ZipFile(apkPath)
                val dexEntries = zip.entries().asSequence().filter {
                    it.name.endsWith(".dex") && !it.isDirectory
                }.toList()

                log.add("  Found ${dexEntries.size} DEX files in APK")

                for (entry in dexEntries) {
                    try {
                        val bytes = zip.getInputStream(entry).readBytes()
                        val buf = ByteBuffer.wrap(bytes)
                        val loader = InMemoryDexClassLoader(buf, classLoader)
                        for (clsName in classNames) {
                            try {
                                loader.loadClass(clsName)
                                log.add("  OK: InMemoryDex: ${entry.name} has $clsName")
                                zip.close()
                                return loader
                            } catch (_: ClassNotFoundException) {}
                        }
                    } catch (e: Exception) {
                        log.add("  FAIL: InMemoryDex ${entry.name}: ${e.message}")
                    }
                }
                zip.close()
            } catch (e: Exception) {
                log.add("  FAIL: InMemoryDex: ${e.message}")
            }
        }

        // Method B: DexClassLoader
        try {
            val optDir = File(filesDir, "dex_opt").also { it.mkdirs() }
            val loader = DexClassLoader(apkPath, optDir.path, null, classLoader)
            for (clsName in classNames) {
                try {
                    loader.loadClass(clsName)
                    return loader
                } catch (_: ClassNotFoundException) {}
            }
        } catch (e: Exception) {
            log.add("  FAIL: DexClassLoader: ${e.message}")
        }

        return null
    }

    private fun initTelpoSDK() {
        val log = mutableListOf<String>()
        val classNames = listOf(
            "com.common.apiutil.printer.ThermalPrinter",
            "com.common.apiutil.printer.NewUsbThermalPrinter",
            "com.common.apiutil.printer.UsbThermalPrinter",
            "com.telpo.tps550.api.printer.ThermalPrinter",
            "com.telpo.tps550.api.printer.UsbThermalPrinter"
        )

        // Step 1: Class.forName
        for (name in classNames) {
            try {
                thermalPrinterClass = Class.forName(name)
                log.add("OK: Class.forName($name)")
                break
            } catch (_: ClassNotFoundException) {
                log.add("FAIL: Class.forName($name)")
            }
        }

        // Step 2: Load from all installed APKs using InMemoryDexClassLoader + DexClassLoader
        if (thermalPrinterClass == null) {
            val pkgs = listOf(
                "com.common.demo",
                "com.telpo.tps550.api",
                "com.common.pos.omcservices",
                "com.common.pos.omcservicesgj",
                "com.telpo.custom",
                "com.common.pos.otaservices",
                "com.android.common.osservice"
            )
            val localDir = File(filesDir, "sdk_apks").also { it.mkdirs() }

            for (pkg in pkgs) {
                try {
                    val appInfo = packageManager.getApplicationInfo(pkg, 0)
                    val srcApk = appInfo.sourceDir
                    log.add("OK: APK $pkg -> $srcApk")

                    // Copy to internal storage
                    val localApk = File(localDir, "$pkg.apk")
                    if (!localApk.exists() || localApk.length() == 0L) {
                        File(srcApk).inputStream().use { input ->
                            localApk.outputStream().use { output -> input.copyTo(output) }
                        }
                        log.add("  Copied to ${localApk.absolutePath} (${localApk.length()} bytes)")
                    }

                    val loader = loadClassesFromApk(localApk.absolutePath, log)
                    if (loader != null) {
                        for (clsName in classNames) {
                            try {
                                thermalPrinterClass = loader.loadClass(clsName)
                                serviceClassLoader = loader
                                log.add("OK: Loaded $clsName from $pkg")
                                break
                            } catch (_: ClassNotFoundException) {}
                        }
                        if (thermalPrinterClass != null) break
                    }
                } catch (e: Exception) {
                    log.add("FAIL: $pkg — ${e.message}")
                }
            }
        }

        // Step 3: createPackageContext
        if (thermalPrinterClass == null) {
            for (pkg in listOf("com.telpo.custom", "com.common.pos.omcservices")) {
                try {
                    val ctx = createPackageContext(pkg, Context.CONTEXT_INCLUDE_CODE or Context.CONTEXT_IGNORE_SECURITY)
                    for (clsName in classNames) {
                        try {
                            thermalPrinterClass = ctx.classLoader.loadClass(clsName)
                            serviceClassLoader = ctx.classLoader
                            log.add("OK: Loaded $clsName from createPackageContext($pkg)")
                            break
                        } catch (_: ClassNotFoundException) {}
                    }
                    if (thermalPrinterClass != null) break
                } catch (e: Exception) {
                    log.add("FAIL: createPackageContext($pkg) — ${e.message}")
                }
            }
        }

        // Step 4: Init
        if (thermalPrinterClass != null) {
            log.add("=== Initializing ===")
            try {
                val cls = thermalPrinterClass!!
                try {
                    cls.getDeclaredMethod("init", Context::class.java).invoke(null, this)
                    log.add("OK: init(context) called")
                } catch (_: NoSuchMethodException) {
                    try {
                        printerInstance = cls.getDeclaredConstructor(Context::class.java).newInstance(this)
                        log.add("OK: Instance via constructor(context)")
                    } catch (e: Exception) {
                        log.add("FAIL: Constructor: ${e.message}")
                    }
                }
                val methods = cls.declaredMethods.map { it.name }.distinct().take(15)
                log.add("Methods: ${methods.joinToString(", ")}")
            } catch (e: Exception) {
                log.add("FAIL: Init: ${e.message}")
            }
        } else {
            log.add("FAIL: No ThermalPrinter class found")
        }

        _scanLog = log
    }

    private var _scanLog = listOf<String>()

    private fun scanForPrinter(): List<String> {
        val found = mutableListOf<String>()
        found.addAll(_scanLog)

        if (_printLog.isNotEmpty()) {
            found.add("=== Print Log ===")
            found.addAll(_printLog)
        }

        found.add("=== Device Files ===")
        for (path in listOf("/dev/ttyHS0", "/dev/ttyHS1", "/dev/ttyS0", "/dev/ttyS1",
                "/dev/ttyS2", "/dev/ttyS3", "/dev/printer0", "/dev/printer",
                "/dev/lp0", "/dev/usb/lp0", "/dev/ttyACM0", "/dev/ttyUSB0")) {
            try {
                val f = File(path)
                if (f.exists()) {
                    found.add("FOUND: $path (write=${try { f.canWrite() } catch (_: Exception) { false }}, read=${try { f.canRead() } catch (_: Exception) { false }})")
                }
            } catch (_: Exception) {}
        }

        found.add("=== Installed Apps ===")
        try {
            for (app in packageManager.getInstalledApplications(0)) {
                val pkg = app.packageName
                if (pkg.contains("telpo", true) || pkg.contains("printer", true) ||
                    pkg.contains("pos", true) || pkg.contains("common", true)) {
                    val apk = try { packageManager.getApplicationInfo(pkg, 0).sourceDir } catch (_: Exception) { "?" }
                    found.add("App: $pkg -> $apk")
                }
            }
        } catch (_: Exception) {}

        found.add("=== System ===")
        found.add("SDK: ${Build.VERSION.SDK_INT}, Board: ${Build.BOARD}, HW: ${Build.HARDWARE}")

        return found
    }

    private fun printViaSDK(text: String) {
        _printLog.clear()
        val errors = mutableListOf<String>()

        if (printerInstance != null) {
            _printLog.add("=== Using instance methods ===")
            val inst = printerInstance!!

            val steps = mutableListOf(
                "start" to arrayOf<Any>(0),
                "clearString" to arrayOf<Any>(),
                "enlargeFontSize" to arrayOf<Any>(0),
                "setAlgin" to arrayOf<Any>(0),
                "setBold" to arrayOf<Any>(true),
                "addString" to arrayOf<Any>(text),
                "printString" to arrayOf<Any>()
            )

            for ((name, args) in steps) {
                try {
                    val m = findMethod(inst.javaClass, name, args)
                    if (m != null) {
                        m.isAccessible = true
                        m.invoke(inst, *args)
                        _printLog.add("OK: $name()")
                    } else {
                        _printLog.add("FAIL: $name not found")
                        errors.add(name)
                    }
                } catch (e: Exception) {
                    val msg = e.cause?.message ?: e.message ?: "null"
                    _printLog.add("FAIL: $name: $msg")
                    errors.add("$name: $msg")
                }
            }

            // Try addBarcode for QR code
            if (_qrUrl != null) {
                _printLog.add("=== QR Code via addBarcode ===")
                val qrPrinted = tryAddBarcode(inst, _qrUrl!!)
                if (qrPrinted) {
                    try {
                        val m = findMethod(inst.javaClass, "printString", emptyArray<Any>())
                        if (m != null) { m.isAccessible = true; m.invoke(inst); _printLog.add("OK: printString(QR)") }
                    } catch (_: Exception) {}
                }
            }

            for (name in listOf("paperCut", "cutPaper")) {
                try {
                    val m = findMethod(inst.javaClass, name, emptyArray<Any>())
                    if (m != null) { m.isAccessible = true; m.invoke(inst); _printLog.add("OK: $name()"); break }
                } catch (_: Exception) {}
            }
            try {
                val m = findMethod(inst.javaClass, "stop", emptyArray<Any>())
                if (m != null) { m.isAccessible = true; m.invoke(inst); _printLog.add("OK: stop()") }
            } catch (_: Exception) {}
        } else {
            printViaSDKStatic(text)
        }
    }

    private var _qrUrl: String? = null

    private fun tryAddBarcode(inst: Any, data: String): Boolean {
        // addBarcode(String content, int symbology, int width, int height, int hriPosition)
        // symbology: 65 = QR_CODE
        val combos = listOf(
            arrayOf<Any>(data, 65, 4, 4, 0),
            arrayOf<Any>(data, 65, 3, 3, 0),
            arrayOf<Any>(data, 65, 4, 0, 0),
            arrayOf<Any>(data, 65, 3, 0, 0),
            arrayOf<Any>(data, 65, 4, 4),
            arrayOf<Any>(data, 65, 3),
            arrayOf<Any>(data, 65),
            arrayOf<Any>(data)
        )
        for (args in combos) {
            try {
                val m = findMethod(inst.javaClass, "addBarcode", args)
                if (m != null) {
                    m.isAccessible = true
                    m.invoke(inst, *args)
                    _printLog.add("OK: addBarcode(${args.size} params)")
                    return true
                }
            } catch (_: Exception) {}
        }
        _printLog.add("FAIL: addBarcode failed")
        return false
    }

    private fun printViaSDKStatic(text: String) {
        _printLog.add("=== Using static ThermalPrinter ===")
        val cls = thermalPrinterClass ?: throw Exception("No class")

        try {
            val m = findStaticMethod(cls, "init", arrayOf<Any>(this))
            m?.invoke(null, this)
            _printLog.add("OK: init(context)")
        } catch (e: Exception) { _printLog.add("FAIL: init: ${e.message}") }

        // Try to create instance
        for (clsName in listOf("com.common.apiutil.printer.NewUsbThermalPrinter", "com.common.apiutil.printer.UsbThermalPrinter", "com.common.apiutil.printer.ThermalPrinter")) {
            try {
                val instCls = serviceClassLoader?.loadClass(clsName) ?: Class.forName(clsName)
                try { printerInstance = instCls.getDeclaredConstructor(Context::class.java).newInstance(this); _printLog.add("OK: Instance $clsName(context)"); break } catch (_: Exception) {}
                try { printerInstance = instCls.getDeclaredConstructor().newInstance(); _printLog.add("OK: Instance $clsName()"); break } catch (_: Exception) {}
            } catch (_: Exception) {}
        }

        if (printerInstance != null) {
            printViaSDK(text)
            return
        }

        // Static fallback
        val staticSteps = mutableListOf(
            "clearString" to emptyArray<Any>(),
            "setFontSize" to arrayOf<Any>(24),
            "setAlgin" to arrayOf<Any>(0),
            "setBold" to arrayOf<Any>(true),
            "addString" to arrayOf<Any>(text),
            "printString" to emptyArray<Any>()
        )
        for ((name, args) in staticSteps) {
            try {
                val m = findStaticMethod(cls, name, args)
                if (m != null) { m.isAccessible = true; m.invoke(null, *args); _printLog.add("OK: $name()") }
            } catch (_: Exception) {}
        }

        for (name in listOf("paperCut", "cutPaper")) {
            try { val m = findStaticMethod(cls, name, emptyArray<Any>()); if (m != null) { m.isAccessible = true; m.invoke(null); _printLog.add("OK: $name()"); break } } catch (_: Exception) {}
        }
    }

    private var _printLog = mutableListOf<String>()

    private fun printQrCodeEscPos(data: String) {
        val bytes = buildQrCodeEscPosBytes(data)
        if (printerInstance != null) {
            try {
                val inst = printerInstance!!
                // Try printQrCode / printQRCode on instance
                for (name in listOf("printQrCode", "printQRCode")) {
                    try {
                        val m = findMethod(inst.javaClass, name, arrayOf<Any>(data, 8, 0))
                        if (m != null) { m.isAccessible = true; m.invoke(inst, data, 8, 0); return }
                    } catch (_: Exception) {}
                    try {
                        val m = findMethod(inst.javaClass, name, arrayOf<Any>(data))
                        if (m != null) { m.isAccessible = true; m.invoke(inst, data); return }
                    } catch (_: Exception) {}
                }
                // Try printRawData
                try {
                    val m = findMethod(inst.javaClass, "printRawData", arrayOf<Any>(bytes))
                    if (m != null) { m.isAccessible = true; m.invoke(inst, bytes); return }
                } catch (_: Exception) {}
                // Try sendCommand
                try {
                    val m = findMethod(inst.javaClass, "sendCommand", arrayOf<Any>(bytes))
                    if (m != null) { m.isAccessible = true; m.invoke(inst, bytes); return }
                } catch (_: Exception) {}
            } catch (_: Exception) {}
        }
        // Fallback: raw bytes to serial port
        printRawBytes(bytes)
    }

    private fun buildQrCodeEscPosBytes(data: String): ByteArray {
        val out = mutableListOf<Byte>()
        val dataBytes = data.toByteArray(Charsets.US_ASCII)

        // GS ( k - Select QR model 2
        out.addAll(byteArrayOf(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00).toList())
        // GS ( k - Set module size (8)
        out.addAll(byteArrayOf(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x08).toList())
        // GS ( k - Store data
        val pL = (dataBytes.size + 3) % 256
        val pH = (dataBytes.size + 3) / 256
        val dL = dataBytes.size % 256
        val dH = dataBytes.size / 256
        out.addAll(byteArrayOf(0x1D, 0x28, 0x6B, pL.toByte(), pH.toByte(), 0x30, 0x45, 0x30, dL.toByte(), dH.toByte()).toList())
        out.addAll(dataBytes.toList())
        // GS ( k - Print QR
        out.addAll(byteArrayOf(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30).toList())
        // Feed lines
        out.addAll(byteArrayOf(0x0A, 0x0A, 0x0A).toList())

        return out.toByteArray()
    }

    private fun printRawBytes(bytes: ByteArray) {
        for (port in listOf("/dev/ttyHS0", "/dev/ttyHS1", "/dev/ttyS0", "/dev/ttyS1",
                "/dev/printer0", "/dev/printer", "/dev/lp0", "/dev/usb/lp0",
                "/dev/ttyACM0", "/dev/ttyUSB0")) {
            try {
                val f = File(port)
                if (f.exists() && f.canWrite()) {
                    FileOutputStream(f).use { it.write(bytes); it.flush() }
                    return
                }
            } catch (_: Exception) {}
        }

        try {
            val proc = Runtime.getRuntime().exec(arrayOf("su", "-c", "cat > /dev/ttyHS0"))
            proc.outputStream.use { it.write(bytes); it.flush() }
            proc.waitFor()
            if (proc.exitValue() == 0) return
        } catch (_: Exception) {}

        throw Exception("Aucun port imprimante accessible")
    }

    private fun callMethod(obj: Any, methodName: String, args: Array<Any> = emptyArray()) {
        try {
            val method = findMethod(obj.javaClass, methodName, args) ?: return
            method.isAccessible = true
            method.invoke(obj, *args)
        } catch (_: Exception) {}
    }

    private fun callStaticMethod(cls: Class<*>, methodName: String, args: Array<Any> = emptyArray()) {
        try {
            val method = findStaticMethod(cls, methodName, args) ?: return
            method.isAccessible = true
            method.invoke(null, *args)
        } catch (_: Exception) {}
    }

    private fun findMethod(clazz: Class<*>, name: String, args: Array<Any>): Method? {
        for (m in clazz.declaredMethods) {
            if (m.name != name || m.parameterTypes.size != args.size) continue
            if (args.indices.all { isTypeCompatible(m.parameterTypes[it], args[it].javaClass) }) return m
        }
        return clazz.superclass?.let { findMethod(it, name, args) }
    }

    private fun findStaticMethod(clazz: Class<*>, name: String, args: Array<Any>): Method? {
        for (m in clazz.declaredMethods) {
            if (m.name != name || !java.lang.reflect.Modifier.isStatic(m.modifiers) || m.parameterTypes.size != args.size) continue
            if (args.indices.all { isTypeCompatible(m.parameterTypes[it], args[it].javaClass) }) return m
        }
        return clazz.superclass?.let { findStaticMethod(it, name, args) }
    }

    private fun isTypeCompatible(expected: Class<*>, actual: Class<*>): Boolean {
        if (expected.isAssignableFrom(actual)) return true
        if (expected == Int::class.javaPrimitiveType || expected == Integer::class.java) return actual == Integer::class.java
        if (expected == Boolean::class.javaPrimitiveType || expected == java.lang.Boolean::class.java) return actual == java.lang.Boolean::class.java
        if (expected == Long::class.javaPrimitiveType || expected == java.lang.Long::class.java) return actual == java.lang.Long::class.java
        if (expected == ByteArray::class.java) return actual == ByteArray::class.java
        return false
    }
}
