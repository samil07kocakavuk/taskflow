# TaskFlow API Dokümanı

Adres: `http://localhost:3000`
Gönderilen ve dönen her şey JSON.

Hatalı isteklerde `success: false` ve `message` dönüyor. Doğrulama hatasında
ayrıca `errors` dizisi var.

Görev ve rapor uçları oturum istiyor. Giriş yapınca `taskflow.sid` çerezi geliyor,
sonraki isteklerde bu çerez gönderilmeli. Oturum yoksa `401`.

## Sağlık

```
GET /api/health
```

```json
{
  "success": true,
  "status": "ok",
  "name": "TaskFlow",
  "version": "1.0.0",
  "uptime": 21.78,
  "timestamp": "2026-10-19T08:21:39.222Z"
}
```

## Giriş

### Kayıt

```
POST /api/auth/register
```

```json
{
  "username": "samil",
  "password": "123456",
  "name": "Samil"
}
```

`username` 3-30 karakter, `password` en az 6 karakter olmalı. `name` opsiyonel.
Cevap `201`:

```json
{
  "success": true,
  "message": "Kullanici olusturuldu.",
  "data": { "id": 1, "username": "samil", "name": "Samil" }
}
```

Aynı kullanıcı adı varsa `409`, alanlar eksikse `400`.

### Giriş

```
POST /api/auth/login
```

```json
{ "username": "samil", "password": "123456" }
```

Cevap `200` ve `Set-Cookie: taskflow.sid=...`:

```json
{
  "success": true,
  "message": "Giris yapildi.",
  "data": { "id": 1, "username": "samil", "name": "Samil" }
}
```

Yanlış bilgide `401`:

```json
{ "success": false, "message": "Kullanici adi veya sifre hatali" }
```

### Çıkış

```
POST /api/auth/logout
```

Oturumu kapatır ve çerezi temizler.

```json
{ "success": true, "message": "Cikis yapildi." }
```

### Oturumdaki kullanıcı

```
GET /api/auth/me
```

```json
{
  "success": true,
  "data": { "id": 1, "username": "samil", "name": "Samil" }
}
```

## Görevler

### Listeleme

```
GET /api/tasks
```

| Parametre | Örnek | Açıklama |
|---|---|---|
| `status` | `completed` | `todo`, `in-progress`, `completed` |
| `priority` | `high` | `low`, `medium`, `high` |
| `assignee` | `samil` | Kişi |
| `project` | `bitirme` | Proje |
| `keyword` | `sunum` | Başlık ve açıklamada arar |
| `sort` | `-createdAt` | `createdAt`, `updatedAt`, `priority`, `title`, `dueDate`, `id` |
| `page` | `1` | Sayfa |
| `limit` | `10` | Sayfa başına kayıt, en fazla 100 |

```
GET /api/tasks?status=todo&priority=high&sort=-createdAt&page=1&limit=10
```

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "title": "React sepet hatasini duzelt",
      "description": "Ayni urun ikinci kez eklenince adet artmiyor.",
      "status": "todo",
      "priority": "high",
      "assignee": "samil",
      "project": "odev",
      "dueDate": "2026-10-24",
      "createdAt": "2026-10-15T18:30:00.000Z",
      "updatedAt": "2026-10-15T18:30:00.000Z"
    }
  ],
  "total": 1,
  "count": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Ekleme

```
POST /api/tasks
```

`title` ve `assignee` zorunlu. Diğerleri opsiyonel; alan hiç gönderilmezse
`status` `todo`, `priority` `medium`, `project` `genel` oluyor. `status` ve
`priority` için `null` kabul edilmiyor.

```json
{
  "title": "Sunum slaytlarini hazirla",
  "description": "Ilk uc slayt bitsin.",
  "priority": "high",
  "assignee": "samil",
  "project": "bitirme",
  "dueDate": "2026-10-27"
}
```

Cevap `201`:

```json
{
  "success": true,
  "message": "Gorev olusturuldu.",
  "data": {
    "id": 9,
    "title": "Sunum slaytlarini hazirla",
    "description": "Ilk uc slayt bitsin.",
    "status": "todo",
    "priority": "high",
    "assignee": "samil",
    "project": "bitirme",
    "dueDate": "2026-10-27",
    "createdAt": "2026-10-19T08:02:11.000Z",
    "updatedAt": "2026-10-19T08:02:11.000Z"
  }
}
```

Eksik alan:

```json
{
  "success": false,
  "message": "Gecersiz veri",
  "errors": ["title zorunlu"]
}
```

### Detay

```
GET /api/tasks/1
```

```json
{
  "success": true,
  "data": { "id": 1, "title": "Bitirme projesi sunumu", "...": "..." }
}
```

Yoksa `404`:

```json
{ "success": false, "message": "Gorev bulunamadi: id=1" }
```

### Güncelleme

```
PUT /api/tasks/1
PATCH /api/tasks/1
```

İkisi de gönderilen alanları güncelliyor. `PUT` genelde tam, `PATCH` kısmi
güncelleme için kullanılır; burada aynı davranıyorlar. `id` ve `createdAt`
korunuyor, `updatedAt` kendiliğinden yenileniyor. `status` ve `priority` için
`null` kabul edilmiyor; `project` boş gönderilirse `genel` oluyor.

```json
{ "status": "completed" }
```

```json
{
  "success": true,
  "message": "Gorev guncellendi.",
  "data": { "id": 1, "status": "completed", "...": "..." }
}
```

### Silme

```
DELETE /api/tasks/1
```

```json
{
  "success": true,
  "message": "Gorev silindi.",
  "data": { "id": 1, "title": "Bitirme projesi sunumu", "...": "..." }
}
```

### Arama

```
GET /api/tasks/search?keyword=sunum
```

`keyword` yoksa `400` dönüyor. Sonuç listesi normal listeyle aynı formatta.

### Kişiye göre

```
GET /api/tasks/assignee/samil
```

## Raporlar

```
GET /api/reports/completed
GET /api/reports/pending
GET /api/reports/summary
```

İlk ikisi `count` ve `tasks` döndürüyor. Özet:

```json
{
  "success": true,
  "report": "summary",
  "data": {
    "total": 8,
    "completed": 1,
    "pending": 7,
    "byStatus": { "todo": 5, "in-progress": 2, "completed": 1 },
    "byPriority": { "high": 2, "medium": 4, "low": 2 },
    "assignees": ["samil", "kerem", "elif"],
    "assigneeCount": 3,
    "generatedAt": "2026-10-19T08:05:00.000Z"
  }
}
```

## Durum kodları

- `200` listeleme, detay, güncelleme, silme
- `201` ekleme, kayıt
- `400` eksik/geçersiz veri, bozuk JSON
- `401` giriş yok veya bilgiler yanlış
- `404` görev veya endpoint yok
- `409` kullanıcı adı alınmış
- `413` gövde çok büyük
- `500` sunucu hatası

## Denemek için

Postman koleksiyonu: `postman/taskflow.postman_collection.json`. Önce
`0. Giriş` klasöründeki `Giriş Yap` isteğini çalıştır; çerez sonraki isteklerde
otomatik gidiyor.
