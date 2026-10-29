# TaskFlow — Proje Tanıtımı

## Kısaca

TaskFlow, günlük işleri ve okul projelerini tek yerden takip etmek için
geliştirilmiş bir REST API'dir. Node.js ve Express kullanılmıştır. Veriler JSON
dosyasında tutulmaktadır; bu boyuttaki bir proje için veritabanı tercih
edilmemiştir.

## Projenin Amacı

Görevlerin not defteri ve telefon uygulaması arasında dağınık tutulması, hangi
işin ne zaman biteceğinin takip edilmesini zorlaştırmaktadır. TaskFlow, hem
backend pratiği hem de günlük kullanım için geliştirilmiştir. Görevler
`data/tasks.json` içinde tutulur ve uçlar üzerinden yönetilir.

## Senaryo

Bir görev başlık, açıklama, durum, öncelik, atanan kişi, proje ve bitiş tarihi
bilgileriyle tutulur. Durum `todo`, `in-progress`, `completed`; öncelik `low`,
`medium`, `high` değerlerinden biridir.

Örnek kayıtlar arasında "bitirme projesi sunumu", "React sepet hatasını düzelt"
ve "staj başvuruları" bulunur. Proje alanı `bitirme`, `odev`, `kariyer`,
`portfolyo` gibi değerlere ayrılmıştır; böylece görevlerin hangi alana ait olduğu
filtrelenerek görülebilir.

## Neler Yapıyor

Görev tarafında beş temel işlem bulunur: ekleme, listeleme, tek görev getirme,
güncelleme ve silme. Listelerken duruma, önceliğe, kişiye ve projeye göre
filtreleme yapılabilir. Başlık ve açıklama içinde arama, sıralama ve sayfalama
desteklenir.

Her istek `logger` middleware'inden geçer. Metot, adres, durum kodu ve geçen
süre hem konsola hem `logs/access.log` dosyasına yazılır. Bozuk isteklerde
`validation` middleware'i 400 döndürür ve hangi alanın yanlış olduğunu belirtir.

Rapor tarafında üç uç bulunur: tamamlanan görevler, bekleyen görevler ve genel
özet. Özet ucu durum/öncelik dağılımını ve görev atanan kişileri verir.

## Giriş

Görev uçları herkese açık bırakılmamıştır. Kayıt, giriş ve çıkış uçları bulunur;
giriş yapıldığında `express-session` bir çerez verir, görev ve rapor uçları bu
oturumu kontrol eder. Şifreler `scrypt` ile hashlenerek `data/users.json` içinde
tutulur; düz şifre saklanmaz. Hazır kullanıcı `samil` / `123456` şeklindedir.

Oturumlar sunucu belleğinde tutulur; sunucu yeniden başlarsa tekrar giriş
yapılması gerekir.

## Mimari

Kod tek dosyada toplanmamış, katmanlara ayrılmıştır. Rotalar isteği controller'a,
controller service'e iletir; service JSON dosyasıyla çalışır. Middleware'ler ayrı
tutulur. Hata yakalama tek merkezdedir: controller içinde try/catch kullanılmaz;
`asyncHandler` hatayı merkezi error handler'a taşır.

`npm test` ile 27 test çalıştırılır. Testler geçici dosyalarla çalışır ve `data/`
içindeki verilere dokunmaz.
