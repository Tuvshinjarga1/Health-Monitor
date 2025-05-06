# Google Fit Мониторинг Систем

Firebase ба Google Fit API ашиглан 50 хүртэлх хэрэглэгчийн эрүүл мэндийн өгөгдлийг мониторинг хийх аппликейшн.

## Функционал тайлбар

- **Firebase Authentication**: Хэрэглэгчдийг Email/Password эсвэл Google OAuth2 ашиглан бүртгэнэ
- **Google Fit холболт**: OAuth2 ашиглан хэрэглэгчийн Google Fit өгөгдөлтэй холбогдоно
- **Firestore Database**: Хэрэглэгчийн refresh token болон өгөгдлийг хадгална
- **Cloud Functions**:
  - /connectFit - Google Fit-тай холбох OAuth URL үүсгэх
  - /oauth2callback - Google Fit зөвшөөрлийн дараа токеныг хадгалах
  - /updateFitData - 15 минут тутамд хэрэглэгчдийн Google Fit өгөгдлийг шинэчлэх
- **Dashboard**: Хэрэглэгчдийн өгөгдлийг харуулах

## Техникийн архитектур

- Frontend: Next.js + React + Tailwind CSS
- Backend: Firebase Cloud Functions
- Өгөгдлийн сан: Cloud Firestore
- Бусад: Cloud Scheduler, Pub/Sub

## Суулгах

1. Node.js болон npm суулгасан байх шаардлагатай
2. Git repo-г clone хийх:

```bash
git clone https://github.com/username/tsag.git
cd tsag
```

3. Хамаарлууд суулгах:

```bash
npm install
```

4. Firebase тохиргоо:

- Firebase Project үүсгэх (https://console.firebase.google.com/)
- Firestore, Authentication (Google provider), Functions сервисүүдийг идэвхжүүлэх
- Firebase CLI суулгах: `npm install -g firebase-tools`
- Firebase-т нэвтрэх: `firebase login`

5. Google Cloud Console дээр Google Fitness API идэвхжүүлэх

6. `.env` файлд тохиргоонуудыг оруулах:

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Firebase тохиргоо
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

7. Firebase Function суулгах:

```bash
cd functions
npm install
cd ..
```

8. Firebase дүрмүүд болон индексүүдийг deploy хийх:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

9. Хөгжүүлэлтийн серверийг ажиллуулах:

```bash
npm run dev
```

10. Firebase функцуудыг deploy хийх:

```bash
firebase deploy --only functions
```

## Ажиллуулах

Дараах URL-д хандана: http://localhost:3000

## Dashboard харах

Нэвтэрсний дараа дараах линк рүү ороход хянах самбар харагдана:
http://localhost:3000/dashboard

## Хэрэглэгчдэд холболтын линк өгөх

Хэрэглэгчдэд дараах линкийг өгөхөд тэд өөрийн Google Fit өгөгдлийг танай системтэй холбох боломжтой:
http://localhost:3000/connect-fit
