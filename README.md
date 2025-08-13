## Kitapçı Yönetimi

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Bu bir kitapçı depo yönetimi projesidir. Bazı temel CRUD operasyonlarını içerir:
1. Pagionation'la tüm kitapları listeleme (GET)
2. Barkoda göre kitap bulma (GET)
3. İsme göre kitap bulma (GET)
4. Barkod kullanarak stoğa ürün ekleme (POST)
5. Barkod kullanarak stoktan ürün eksiltme (DEL)
6. Toplu fiyat ekleme/güncelleme (PUT)


Bunlarla beraber sade bir önyüz tasarımı vardır. 
Anasayfada 2,3,4,5 operasyonları varken 
10 ürünün sayfalandığı tablo kısmında 1 ve 6. operasyonlar yapılır.
