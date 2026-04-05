# مفتاح - إدارة المتجر (Miftah Store Management Desktop)

تطبيق سطح مكتب لإدارة المتجر الرقمي مبني بـ React + Vite + Electron.

## المتطلبات

- Node.js 18+
- npm

## التثبيت

```bash
npm install
```

## وضع التطوير

لتشغيل التطبيق في وضع التطوير:

```bash
npm run electron:dev
```

هذا الأمر يقوم بتشغيل خادم Vite و Electron معاً.

## بناء ملف التثبيت (.exe)

لبناء ملف التثبيت لنظام Windows:

```bash
npm run electron:build
```

سيتم إنشاء ملف `.exe` في مجلد `/release`.

## تشغيل كتطبيق ويب

```bash
npm run dev
```

## ملاحظات

- التطبيق يستخدم localStorage لتخزين البيانات محلياً.
- جميع الأرقام تستخدم الأرقام الغربية (0-9).
- واجهة المستخدم بالعربية مع دعم RTL.
