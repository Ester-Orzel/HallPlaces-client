# Makom – HallPlaces Client (React)

צד הלקוח של מערכת HallPlaces להזמנת מושבים לאירועים. נבנה עם Vite + React.
הלקוח מדגים את השרת מקצה לקצה: התחברות/הרשמה עם JWT, רשימת אירועים עם עימוד אמיתי מול השרת,
מפת מושבים עם הזמנה, הודעה ברורה כשהשרת מחזיר 409 (המושב נתפס), והזמנות שלי עם ביטול.

- ריפו השרת: `<קישור לריפו של השרת>`
- הלקוח באוויר (Render): `<קישור ללקוח>`

## המסכים
| מסך | מה הוא מדגים |
|---|---|
| התחברות / הרשמה | `POST /api/auth/login`, `POST /api/auth/register`. הטוקן נשמר ב-localStorage ונשלח ב-`Authorization: Bearer ...` |
| אירועים | `GET /api/events?page=&pageSize=&search=&categoryId=&sortBy=&descending=` – עימוד, חיפוש, סינון ומיון בשרת |
| מפת מושבים + הזמנה | `GET /api/events/{id}/seats`, `POST /api/bookings`. צבע המושב לפי אזור המחיר (קדמי/אמצעי/אחורי – המחיר נקבע בשרת). על **409** מוצגת הודעה "That seat was just taken" והמפה נטענת מחדש |
| ההזמנות שלי | `GET /api/bookings/mine`, `DELETE /api/bookings/{id}` |

## הרצה מקומית
דרישות: Node.js 20+ והשרת רץ מקומית.

```
npm install
copy .env.example .env      (ב-Windows; או cp ב-Mac/Linux)
npm run dev
```
הלקוח עולה ב-`http://localhost:5173` (הכתובת שהשרת מתיר ב-CORS).

ב-`.env` מגדירים את כתובת השרת – **בדיוק** הכתובת שבה Swagger נפתח, בלי `/swagger` ובלי `/` בסוף:
- פרופיל `http` ב-Visual Studio: `VITE_API_URL=http://localhost:5082`
- פרופיל `https`: `VITE_API_URL=https://localhost:7122`

## הדגמת ההתנגשות (409)
1. פתחי שני חלונות: חלון רגיל וחלון גלישה בסתר.
2. בשניהם פתחי את אותו אירוע. בחלון אחד התחברי כ-Dana ובשני כ-Ron (כפתורי "Try a demo user" במסך ההתחברות; סיסמה `Customer123!`).
3. בשני החלונות בחרי את אותו מושב.
4. דנה לוחצת **Book this seat**, וההזמנה מצליחה. רון לוחץ ומקבל **"That seat was just taken."** (409 מהשרת), והמושב מסומן תפוס.

## פריסה ב-Render (Static Site)
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variable: `VITE_API_URL=<כתובת השרת ב-Render>`

> `VITE_API_URL` נצרב לתוך הקוד בזמן ה-build. אם משנים אותו – צריך לעשות Deploy מחדש.
