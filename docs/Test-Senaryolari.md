# TaskFlow — Yazılı Test Senaryoları

Bu doküman TaskFlow API'sinin manuel, Postman ve otomatik test adımlarını
tanımlar. Başlangıç adresi: `http://localhost:3000`.

## Ön koşullar

- `npm install` ve `npm start` çalıştırılmış olmalı.
- Giriş için hazır kullanıcı: `samil` / `123456`.
- Görev ve rapor uçları için `taskflow.sid` çerezi gönderilmeli.
- Her senaryo, önceki senaryonun bıraktığı veriyi bozmayacak sırada çalıştırılır.

## Senaryolar

| ID | Alan | Adım | Beklenen sonuç |
|---|---|---|---|
| T01 | Sağlık | `GET /api/health` | `200`; `status: "ok"`, `name: "TaskFlow"` |
| T02 | Yetki | Giriş yapmadan `GET /api/tasks` | `401` |
| T03 | Kayıt | Benzersiz kullanıcıyla `POST /api/auth/register` | `201`; cevapta `passwordHash` yok |
| T04 | Kayıt | Aynı kullanıcı adıyla tekrar kayıt | `409` |
| T05 | Giriş | Yanlış şifreyle `POST /api/auth/login` | `401` |
| T06 | Giriş | Doğru bilgiyle `POST /api/auth/login` | `200`; `taskflow.sid` çerezi gelir |
| T07 | Oturum | Çerezle `GET /api/auth/me` | `200`; kullanıcı bilgisi döner |
| T08 | Çıkış | `POST /api/auth/logout`, sonra `GET /api/tasks` | Önce `200`, sonra `401` |
| T09 | Ekleme | Geçerli `title` ve `assignee` ile `POST /api/tasks` | `201`; varsayılanlar `todo`, `medium`, `genel` |
| T10 | Doğrulama | `title` olmadan görev ekleme | `400`; `errors` içinde `title zorunlu` |
| T11 | Doğrulama | `priority: "urgent"` ile görev ekleme | `400` |
| T12 | Doğrulama | `status`, `priority` veya `project` alanına `null` gönderme | `400` |
| T13 | Listeleme | `GET /api/tasks` | `200`; varsayılan `limit: 10` |
| T14 | Filtre | `GET /api/tasks?priority=high` | `200`; yalnızca `high` görevler |
| T15 | Arama | `GET /api/tasks/search?keyword=sunum` | `200`; başlık/açıklamada eşleşenler |
| T16 | Sıralama | `GET /api/tasks?sort=-createdAt` | `200`; en yeni kayıt önce |
| T17 | Sayfalama | `GET /api/tasks?page=1&limit=2` | `200`; `count: 2`, `limit: 2` |
| T18 | Sayfalama | `GET /api/tasks?limit=500` | `200`; etkin `limit: 100` |
| T19 | Detay | `GET /api/tasks/:id` | `200`; istenen görev döner |
| T20 | Detay | Olmayan ID ile `GET /api/tasks/9999` | `404` |
| T21 | Güncelleme | `PUT` veya `PATCH` ile `status` değiştirme | `200`; `status` ve `updatedAt` güncellenir |
| T22 | Güncelleme | Boş gövdeyle `PUT /api/tasks/:id` | `400`; güncellenecek alan yok |
| T23 | Güncelleme | `project: "   "` gönderme | `200`; `project: "genel"` |
| T24 | Güncelleme | `status: null` veya `priority: null` gönderme | `400` |
| T25 | Güncelleme | `description: null` veya `dueDate: null` gönderme | `200`; ilgili alan temizlenir |
| T26 | Silme | `DELETE /api/tasks/:id` | `200`; silinen görev döner |
| T27 | Silme | Silinen ID ile tekrar `GET` | `404` |
| T28 | ID | Silmeden sonra yeni görev ekleme | Yeni ID, silinen ID'den farklı olur |
| T29 | Rapor | `GET /api/reports/completed` | `200`; `completed` görevler ve `count` |
| T30 | Rapor | `GET /api/reports/pending` | `200`; `completed` dışındaki görevler ve `count` |
| T31 | Rapor | `GET /api/reports/summary` | `200`; `total = completed + pending`, dağılımlar tutarlı |
| T32 | Hata | Olmayan endpoint | `404`; `success: false` |
| T33 | Hata | Bozuk JSON gövdesi | `400`; `Gecersiz JSON` |
| T34 | Hata | 100 KB'den büyük JSON gövdesi | `413` |
| T35 | Log | Normal ve bozuk JSON isteğinden sonra log dosyası | Metot, endpoint, durum kodu, timestamp ve süre yazılmış olur |
| T36 | Eşzamanlılık | 10 paralel `POST /api/tasks` | Hepsi `201`; toplam görev sayısı 10 artar |
| T37 | Kalıcılık | Sunucuyu yeniden başlatıp `GET /api/tasks` | Önceki görevler korunur |

## Postman ile çalıştırma

1. `postman/taskflow.postman_collection.json` dosyasını import et.
2. `0. Giriş` klasöründe önce `Giriş Yap` isteğini çalıştır.
3. `2. Görevler` altındaki CRUD isteklerini sırayla çalıştır.
4. `5. Hatalı İstekler` ve rapor isteklerini kontrol et.
5. Sonuçları `screenshots/` altındaki görüntülerle birlikte değerlendir.

## Otomatik testler

`npm test` komutu aynı davranışların büyük bölümünü geçici dosyalarla doğrular.
Testler `data/` altındaki gerçek verilere dokunmaz.
