# Veri Modeli

İki kayıt tipi var: `Task` ve `User`.

## Task

| Alan | Tip | Zorunlu | Not |
|---|---|---|---|
| `id` | sayı | otomatik | Artan numara, silinen ID tekrar verilmiyor |
| `title` | metin | evet | En fazla 100 karakter |
| `description` | metin | hayır | En fazla 500 karakter, boş olabilir |
| `status` | metin | hayır | `todo`, `in-progress`, `completed`; varsayılan `todo` |
| `priority` | metin | hayır | `low`, `medium`, `high`; varsayılan `medium` |
| `assignee` | metin | evet | Görevin atandığı kişi, en fazla 50 karakter |
| `project` | metin | hayır | Varsayılan `genel`; boş gönderilirse `genel` olur |
| `dueDate` | tarih | hayır | `YYYY-AA-GG`, boş bırakılabilir |
| `createdAt` | tarih-saat | otomatik | Oluşturulma zamanı |
| `updatedAt` | tarih-saat | otomatik | Son güncelleme |

Örnek:

```json
{
  "id": 1,
  "title": "Bitirme projesi sunumu",
  "description": "Slaytlari hazirla, canli demo icin Postman koleksiyonunu duzenle.",
  "status": "in-progress",
  "priority": "high",
  "assignee": "samil",
  "project": "bitirme",
  "dueDate": "2026-10-29",
  "createdAt": "2026-10-12T19:04:00.000Z",
  "updatedAt": "2026-10-17T21:15:00.000Z"
}
```

## User

| Alan | Tip | Not |
|---|---|---|
| `id` | sayı | Artan numara |
| `username` | metin | 3-30 karakter, tekil, küçük harfe çevriliyor |
| `name` | metin | Görünen ad |
| `passwordHash` | metin | `scrypt$tuz$hash` formatında, düz şifre tutulmuyor |
| `createdAt` | tarih-saat | Oluşturulma zamanı |

`passwordHash` hiçbir cevapta dönmüyor; `sanitize` fonksiyonu sadece `id`,
`username` ve `name` gönderiyor.

## Dosya düzeni

`data/tasks.json`:

```json
{
  "nextId": 9,
  "tasks": [ ... ]
}
```

`data/users.json`:

```json
{
  "nextId": 2,
  "users": [
    {
      "id": 1,
      "username": "samil",
      "name": "Samil",
      "passwordHash": "scrypt$...$...",
      "createdAt": "2026-10-19T08:00:00.000Z"
    }
  ]
}
```

`nextId` bir sonraki kaydın numarasını tutar. Yalnızca en büyük ID'ye bakılıp
bir fazlası verilseydi, silinen kaydın numarası yeni kayda tekrar gelirdi. Bu
nedenle sayaç ayrı tutulur. Silinen bir ID'nin tekrar kullanılmaması bilinçli bir
tercihtir; eski bağlantıların yanlış kayda işaret etmesini önler.

`status`, `priority` ve `project` alanlarında `null` kabul edilmiyor. `description`
ve `dueDate` alanları temizlemek için `null` gönderilebilir.

Dosya yoksa ilk çalıştırmada oluşuyor. Her yazma işleminde önce `.tmp` dosyasına
yazılıp sonra `rename` ile asıl dosyanın üzerine taşınıyor; yarım yazılmış dosya
okunmuyor. Aynı anda gelen yazma istekleri sıraya alınıyor. JSON bozuksa veri
sessizce sıfırlanmıyor, hata dönüyor.
