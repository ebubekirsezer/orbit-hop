# Orbit Hop

YouTube Playables için tek dokunuşlu bir oyun. Küçük bir uzaylı, dönen gezegenler arasında zıplar.
Bastığın gezegen birkaç saniye içinde ufalanır, o yüzden doğru anda zıplaman gerekir.

- **Kontrol:** dokun, tıkla veya Boşluk/Enter tuşuna bas.
- **Puan:** her yeni gezegen +1 puan. Gezegenin tam ortasına inersen "Mükemmel!" bonusu +1 puan verir.
- **Yıldızlar:** yolda topladığın yıldızlarla menüde 6 yeni karakter rengi açılır.
- **Zorluk:** ilerledikçe gezegenler küçülür, hızlanır, aralar açılır ve bazıları sağa sola kayar.
- **Diller:** İngilizce, Türkçe, İspanyolca, Portekizce, Almanca ve Fransızca. Dil YouTube'un ayarından okunur.

Dış bağımlılık, resim veya ses dosyası yoktur. Grafikler ve sesler kodla üretilir. Paket boyutu yaklaşık 35 KB'tır.

## Yerelde çalıştırma

```bash
python3 -m http.server 8765 --directory game
```

Sonra tarayıcıda `http://localhost:8765/` adresini aç. Türkçe görmek için `?lang=tr` ekle.
YouTube dışında SDK hiçbir şey yapmaz. Kayıt sadece yerel test için tarayıcıya yazılır.

## Paketleme

```bash
./build.sh
```

`dist/orbit-hop.zip` oluşur. `index.html` zip'in kök dizinindedir.

## Playables kurallarına uyum

| Kural | Durum |
|---|---|
| SDK diğer tüm kodlardan önce yüklenir | `index.html` içinde ilk script |
| `firstFrameReady` yükleme ekranında çağrılır | Evet |
| `gameReady` menü etkileşime hazır olunca çağrılır | Evet |
| Kayıt sadece `saveData` ile, `loadData` beklendikten sonra | Evet, eski veya bozuk kayıtlar güvenle okunur |
| `sendScore` kayıttaki en iyi skorla aynı | Evet, sadece yeni rekorda gönderilir |
| `onPause` ile döngü, ses ve çizim durur | Evet, Page Visibility API kullanılmaz |
| YouTube sessiz ayarına uyulur, oyunda genel ses düğmesi yok | Evet |
| Dil sadece `getLanguage` ile, `navigator.language` kullanılmaz | Evet |
| Dış ağ isteği yok | Evet, sadece SDK |
| Her en-boy oranında çalışır, yön kilidi yok | Dikey ve yatay test edildi |
| Dokunma ve fare desteği, klavye desteği | Evet |
| Esc tuşu engellenmez | Evet |
| Dış link, paylaşım, giriş ekranı, kişisel veri yok | Evet |
| İlk paket < 30 MiB, dosya < 512 KiB | Yaklaşık 35 KB |

## YouTube'da yayınlama

Playables şu an herkese açık değildir. YouTube, oyunları başvuru formuyla seçer.

1. https://developers.google.com/youtube/gaming/playables adresindeki **Playables interest form** formunu doldur.
2. Kabul edilirsen bir Partner Manager atanır. Developer Portal ve SDK Test Suite erişimi açılır.
3. Test Suite ile oyunu doğrula, sonra `dist/orbit-hop.zip` dosyasını portala yükle.
4. Mağaza bilgileri için başlık, açıklama ve kapak görseli hazırla. Bunlarda marka veya logo olmamalı.

Formu kendin doldurman gerekir, çünkü kişisel ve şirket bilgilerini içerir.
