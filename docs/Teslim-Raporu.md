# Teslim Raporu — TaskFlow

**Öğrenci:** İsmail Şamil Kocakavuk
**Ders:** Backend Geliştirme
**Teslim Tarihi:** 19.10.2026
**GitHub:** https://github.com/samil07kocakavuk/taskflow

---

## 1. Projenin Amacı

TaskFlow, günlük işleri ve okul projelerini tek yerden takip etmek için
geliştirilmiş bir REST API. Node.js ve Express kullanıldı. Amaç, görevlerin
oluşturulması, bir kişiye atanması, durum takibi ve önceliklendirilmesini
sağlayan bir altyapı kurmak. Yönergedeki görev ve proje yönetim sistemi
senaryosunu temel alıp kendi günlük kullanımıma göre uyarladım.

Projede görev yönetimi (CRUD), kullanıcı girişi (session), istek loglama,
veri doğrulama, filtreleme/arama/sayfalama ve raporlama bulunuyor.

## 2. Kullanılan Teknolojiler

| Teknoloji | Ne için |
|---|---|
| Node.js | Çalışma ortamı |
| Express.js | Routing ve middleware |
| express-session | Oturum yönetimi |
| cors | Frontend erişimi |
| Node `crypto` | Şifre hashleme (scrypt) |
| JSON dosyası | Kalıcı veri saklama |
| Postman | API testleri |
| `node:test` | Otomatik testler |

## 3. Yapılanlar

- Görev ekleme, listeleme, detay, güncelleme (`PUT` ve `PATCH`) ve silme
- Kayıt, giriş, çıkış ve oturum bilgisi uçları
- Session + çerez ile kimlik doğrulama; görev ve rapor uçları korumalı
- Şifrelerin `scrypt` ile hashlenmesi
- Bozuk JSON ve büyük gövde istekleri dahil her isteği konsola ve `logs/access.log`
  dosyasına yazan logger middleware
- Alan doğrulama: `title` ve `assignee` zorunlu; `priority`, `status`, `dueDate`,
  `project` için tip ve değer kontrolü
- Durum, öncelik, kişi ve projeye göre filtreleme
- Başlık/açıklamada arama, sıralama ve sayfalama
- Tamamlanan, bekleyen ve genel özet raporları
- Merkezi hata yönetimi ve 404 yakalama
- JSON dosyasına atomik yazma ve eşzamanlı yazma koruması
- 27 otomatik test

## 4. API Uçları

Toplam 16 uç var. Ayrıntılı doküman: `docs/API-Dokumani.md`.

| Metot | Yol | Giriş gerekir |
|---|---|---|
| GET | `/api/health` | Hayır |
| POST | `/api/auth/register` | Hayır |
| POST | `/api/auth/login` | Hayır |
| POST | `/api/auth/logout` | Hayır |
| GET | `/api/auth/me` | Evet |
| GET | `/api/tasks` | Evet |
| POST | `/api/tasks` | Evet |
| GET | `/api/tasks/:id` | Evet |
| PUT | `/api/tasks/:id` | Evet |
| PATCH | `/api/tasks/:id` | Evet |
| DELETE | `/api/tasks/:id` | Evet |
| GET | `/api/tasks/search?keyword=` | Evet |
| GET | `/api/tasks/assignee/:assignee` | Evet |
| GET | `/api/reports/completed` | Evet |
| GET | `/api/reports/pending` | Evet |
| GET | `/api/reports/summary` | Evet |

## 5. Veri Modeli

İki kayıt tipi var: `Task` ve `User`. Ayrıntı: `docs/Veri-Modeli.md`.

**Task:** `id`, `title`, `description`, `status`, `priority`, `assignee`,
`project`, `dueDate`, `createdAt`, `updatedAt`

**User:** `id`, `username`, `name`, `passwordHash`, `createdAt`

Veriler `data/tasks.json` ve `data/users.json` dosyalarında tutuluyor. Silinen
kaydın ID'si tekrar kullanılmıyor (`nextId` sayacı). Yazma işlemleri sıraya
alınıyor ve önce geçici dosyaya yazılıp sonra asıl dosyanın üzerine taşınıyor.

## 6. Proje Yapısı

```
data/                 tasks.json, users.json
docs/                 tanitim, veri modeli, API dokumani, test senaryolari, bu rapor
postman/              postman koleksiyonu
src/config            ayarlar
src/controllers       istek/cevap katmani
src/middleware        logger, validation, oturum kontrolu, hata yakalama
src/routes            rotalar
src/services          is mantigi
src/utils             dosya deposu, yardimcilar
test/                 api.test.js
```

## 7. Kurulum ve Çalıştırma

```bash
npm install
npm start
```

Sunucu: `http://localhost:3000`

Hazır kullanıcı: **`samil` / `123456`**

Giriş yapmadan görev uçları `401` döner. Önce `POST /api/auth/login` çağrılmalı,
dönen `taskflow.sid` çerezi sonraki isteklerde gönderilmeli. Postman koleksiyonu
bunu kendisi yapıyor.

## 8. Testler

### Otomatik testler

```bash
npm test
```

Sonuç: **27 test, 27 başarılı, 0 hata.** Testler geçici dosyalarla çalışıyor,
`data/` içindeki verilere dokunmuyor. Kapsam: giriş/çıkış, CRUD, `PATCH`,
doğrulama hataları, 404, arama, filtre, sayfalama, loglama, raporlar ve
eşzamanlı yazma.

### Postman

Koleksiyon: `postman/taskflow.postman_collection.json`

Sonuç: **24 istek, 0 hata.** Koleksiyon sırasıyla kayıt, giriş, görev CRUD,
filtre/arama/sayfalama, raporlar, hatalı istekler ve çıkış adımlarını içeriyor.

### Ekran Görüntüleri

Aşağıdaki görüntüler `screenshots/` klasörüne eklendi.

| # | İstek | Beklenen |
|---|---|---|
| 1 | Giriş | 200 OK |
| 2 | Ekleme | 201 Created |
| 3 | Listeleme | 200 OK |
| 4 | Detay | 200 OK |
| 5 | Güncelleme | 200 OK |
| 6 | Silme | 200 OK |

![Giriş](../screenshots/1-giris.png)

![Ekleme](../screenshots/2-ekleme.png)

![Listeleme](../screenshots/3-listele.png)

![Detay](../screenshots/4-detay.png)

![Güncelleme](../screenshots/5-guncelleme.png)

![Silme](../screenshots/6-silme.png)

## 9. Yönerge Gereksinimleri

| Gereksinim | Nerede |
|---|---|
| CRUD işlemleri | `src/services/taskService.js`, `POST/GET/PUT/PATCH/DELETE /api/tasks` |
| Routing yapısı | `src/routes/` (index, taskRoutes, reportRoutes, authRoutes) |
| Logger middleware | `src/middleware/logger.js` |
| Kod kalitesi | Katmanlı yapı: routes → controllers → services → utils |
| Dokümantasyon | `README.md`, `docs/Proje-Tanitim-Dokumani.md`, `docs/Veri-Modeli.md`, `docs/API-Dokumani.md`, `docs/Test-Senaryolari.md` |
| Postman testleri | `postman/taskflow.postman_collection.json`, `screenshots/` |
| Public GitHub reposu | https://github.com/samil07kocakavuk/taskflow |

## 10. Teslim Edilen Dosyalar

- Kaynak kod (tüm `src/`, `package.json`, `package-lock.json`)
- `README.md` — kurulum ve çalıştırma
- `docs/Proje-Tanitim-Dokumani.md` — proje tanıtımı
- `docs/Veri-Modeli.md` — veri modeli
- `docs/API-Dokumani.md` — request/response örnekli API dokümanı
- `docs/Test-Senaryolari.md` — yazılı test senaryoları
- `docs/Teslim-Raporu.md` — bu rapor
- `postman/taskflow.postman_collection.json` — Postman koleksiyonu
- `screenshots/` — Postman ekran görüntüleri
- `test/api.test.js` — otomatik testler

## 11. Bilinen Sınırlar

- Veritabanı yok; veriler JSON dosyasında. Tek sunucu (process) için tasarlandı.
- Session'lar sunucu belleğinde; sunucu yeniden başlarsa tekrar giriş gerekir.
- `assignee` ve `project` ayrı tablo değil, düz metin.
- Kimlik doğrulama çerez tabanlı; token/API key desteği yok.
