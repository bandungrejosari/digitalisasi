// 1. Buat Peta
let map = L.map('map', {
    zoomControl: false,
    maxZoom: 22
}).setView([-8.006657, 112.618495], 18);


// Wadah untuk daftar UMKM
let daftarUMKM = [];

// 2. Tampilan OpenStreetMap
L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors',
        maxNativeZoom: 19,
        maxZoom: 22
    }
).addTo(map);

// 3. Icon Kuliner

// 4. Marker Statis Kantor Kelurahan
L.marker([-8.0070465, 112.6184146])
    .addTo(map)
    .bindPopup(`
        <div class="popup-kelurahan">
            <div class="judul-kelurahan">
                Kantor Kelurahan Bandungrejosari
            </div>

            <div class="info-kelurahan">
                Pusat administrasi Kelurahan Bandungrejosari
            </div>

            <a
                href="https://maps.app.goo.gl/VX1VcqXCi95u9Ejv9"
                target="_blank"
                class="btn-gmaps"
            >
                📍 Lihat di Google Maps
            </a>
        </div>
    `)
    .openPopup();



// 5. Membaca Data Google Sheet
const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1UCtxXlzMVz3AUDdIpmyT7lcO7sUXq4Kn9woEfU8rY2U9qS7XLhmjS4Sc3W6n8T-aqFTLnkzdbwPL/pub?output=csv';
 
const makananIcon = L.icon({
    iconUrl: "Food.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35]
    });

const minumanIcon = L.icon({
    iconUrl: "Drink.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35]
    });

const iconAktif = L.icon({
    iconUrl: "Ikonaktif.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -35]
    });
    

Papa.parse(sheetUrl, {
    download: true,
    header: true,
    complete: function(results) {
        console.log("Data Sheet:", results.data);

        // SATUKAN PROSES DI SINI
        results.data.forEach(function(umkm){
            if(umkm.Lat && umkm.Long){
                
                // Ubah koordinat jadi angka
                const lat = parseFloat(umkm.Lat.replace(',', '.'));
                const lon = parseFloat(umkm.Long.replace(',', '.'));
                
                // Foto Array
                const fotoArray = umkm.URL
                .split(",")
                .map(f => f.trim())

                let galeri = "";

                fotoArray.forEach(function(link){   
                        galeri += `
                            <img
                                src="${link}"
                                onclick="lihatFoto('${link}')"
                                style="
                                    height:180px;
                                    width:auto;
                                    border-radius:8px;
                                    cursor:pointer;
                                    flex-shrink:0;
                                "
                            >
                            `;
                    });

                // Buat marker dengan icon, foto, dan link
                let iconUMKM;

                if (umkm.Jenis === "Makanan") {
                    iconUMKM = makananIcon;
                } else if (umkm.Jenis === "Minuman") {
                    iconUMKM = minumanIcon;
                } else {
                    iconUMKM = makananIcon; // ikon default jika jenis tidak dikenali
                }
                const marker = L.marker([lat, lon], {icon : iconUMKM})
            .addTo(map)
            ;
            // Pasang popup kecil untuk pencarian
            marker.bindPopup(`
                <div class="popup-title">
                    ${umkm.NamaUsaha} ${
                        umkm.Rekomendasi === "Ya"
                        ? `<img src="Rekomendasi.png" class="icon-rekomendasi" alt="Rekomendasi">`
                        : ""
                    }
                </div>
            `);
    
        marker.on("click", function(){
            const offsetLat = lat - 0.00009;

            map.flyTo([offsetLat, lon], 20, {
                animate: true,
                duration: 0.8
            });
           
            daftarUMKM.forEach(function(item){

                if(item.Jenis === "Makanan"){
                    item.marker.setIcon(makananIcon);
                }
                else if(item.Jenis === "Minuman"){
                    item.marker.setIcon(minumanIcon);
                }

            });
            marker.setIcon(iconAktif);

            bukaSheet(`
                <div style="
                    display:flex;
                    overflow-x:auto;
                    gap:10px;
                ">
                    ${galeri}
                </div>

                <div class="popup-title">
                    <span>${umkm.NamaUsaha} (${umkm.Jenis})</span>

                    ${
                        umkm.Rekomendasi === "Ya"
                        ? `<img src="Rekomendasi.png" class="icon-rekomendasi" alt="Rekomendasi">`
                        : ""
                    }
                </div>

                <div class="popup-content">

                    <b>Hari Buka:</b>
                    ${umkm.Hari_buka || "-"}<br>

                    <b>Jam Operasional:</b>
                    ${umkm.Jam_opr || "-"}<br>
                    <b>Menu:</b>
                    ${umkm.Menu || "-"}<br>


                </div>

                

                <div class="popup-button">

                    <a href="${umkm.Gmaps}" target="_blank">
                        Google Maps
                    </a>

                    ${
                        umkm.LinkWA ?
                        `<a href="${umkm.LinkWA}" target="_blank">
                            Pesan Sekarang
                        </a>`
                        : ""
                    }

                </div>
            `);

        });

                // Simpan data ke dalam array untuk dihitung jaraknya nanti
                daftarUMKM.push({
                    Nama: umkm.NamaUsaha,
                    Lat: lat,
                    Lon: lon,
                    marker: marker, 
                    Jenis: umkm.Jenis,
                    Menu: umkm.Menu,
                    Rekomendasi: umkm.Rekomendasi,
                    Hari_buka: umkm.Hari_buka
                });
            }
        });
    }
});



function cariTerdekat() {
    if (!navigator.geolocation) {
        alert("Browser Anda tidak mendukung fitur lokasi.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function (pos) {
            const userLat = pos.coords.latitude;
            const userLon = pos.coords.longitude;

            daftarUMKM.forEach(function (umkm) {
                const latFloat = parseFloat(String(umkm.Lat).replace(',', '.'));
                const lonFloat = parseFloat(String(umkm.Lon).replace(',', '.'));

                // Menghitung jarak pengguna dengan tiap UMKM
                umkm.jarak = hitungJarak(userLat, userLon, latFloat, lonFloat);
            });

            // Urutkan dari yang paling dekat
            daftarUMKM.sort((a, b) => a.jarak - b.jarak);

            tampilkanDaftar();
        },
        function (error) {
            alert("Gagal mengambil lokasi: " + error.message);
        }
    );
}

function tampilkanDaftar(data = daftarUMKM) {
       let html = `
        <div class="sheet-title">Kuliner Terdekat</div>
        <div class="daftar-scroll">
        `;

        data.forEach(function(umkm){

            html += `
            <div class="daftar-item" onclick="zoomUMKM('${umkm.Nama}')">
                <div class="nama-usaha">
                    <b>${umkm.Nama}</b>

                    ${
                        umkm.Rekomendasi === "Ya"
                        ? `<img src="Rekomendasi.png" class="icon-rekomendasi" alt="Rekomendasi">`
                        : ""
                    }
                </div>

                <small class="daftar-menu">
                    ${umkm.Menu || "Menu belum tersedia"}
                </small>

                <small>📍 ${umkm.jarak.toFixed(2)} km</small>
            </div>
            `;

        });

        html += `</div>`;

        bukaSheet(html);

}

function cariMakananTerdekat() {

    if (!navigator.geolocation) {
        alert("Browser Anda tidak mendukung fitur lokasi.");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        function (pos) {

            const userLat = pos.coords.latitude;
            const userLon = pos.coords.longitude;

            // Ambil hanya UMKM kategori Makanan
            let daftarMakanan = daftarUMKM.filter(
                umkm => umkm.Jenis === "Makanan"
            );

            // Hitung jarak
            daftarMakanan.forEach(function (umkm) {

                const latFloat = parseFloat(String(umkm.Lat).replace(',', '.'));
                const lonFloat = parseFloat(String(umkm.Lon).replace(',', '.'));

                umkm.jarak = hitungJarak(
                    userLat,
                    userLon,
                    latFloat,
                    lonFloat
                );

            });

            // Urutkan berdasarkan jarak
            daftarMakanan.sort((a, b) => a.jarak - b.jarak);

            // Tampilkan daftar makanan
            tampilkanDaftar(daftarMakanan);

        },

        function (error) {

            alert("Gagal mengambil lokasi: " + error.message);

        }

    );

}

function cariMinumanTerdekat() {

    if (!navigator.geolocation) {
        alert("Browser Anda tidak mendukung fitur lokasi.");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        function (pos) {

            const userLat = pos.coords.latitude;
            const userLon = pos.coords.longitude;

            // Ambil hanya UMKM kategori Minuman
            let daftarMinuman = daftarUMKM.filter(
                umkm => umkm.Jenis === "Minuman"
            );

            // Hitung jarak
            daftarMinuman.forEach(function (umkm) {

                const latFloat = parseFloat(String(umkm.Lat).replace(',', '.'));
                const lonFloat = parseFloat(String(umkm.Lon).replace(',', '.'));

                umkm.jarak = hitungJarak(
                    userLat,
                    userLon,
                    latFloat,
                    lonFloat
                );

            });

            // Urutkan berdasarkan jarak
            daftarMinuman.sort((a, b) => a.jarak - b.jarak);

            // Tampilkan 5 terdekat
            tampilkanDaftar(daftarMinuman);

        },

        function (error) {

            alert("Gagal mengambil lokasi: " + error.message);

        }

    );

}

function zoomUMKM(nama) {

    document.getElementById("searchOverlay").style.display = "none";
    tutupSearch();

    tutupSheet();

    const umkm = daftarUMKM.find(x => x.Nama === nama);

    if (umkm) {

        const latFloat = parseFloat(String(umkm.Lat).replace(',', '.'));
        const lonFloat = parseFloat(String(umkm.Lon).replace(',', '.'));

        map.setView([latFloat, lonFloat], 20);

        setTimeout(() => {
            umkm.marker.openPopup();
        }, 300);

    }
}


function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius bumi dalam kilometer
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
}

const toolbar = document.querySelector(".map-toolbar");

const searchOverlay = document.getElementById("searchOverlay");
L.DomEvent.disableClickPropagation(toolbar);
L.DomEvent.disableScrollPropagation(toolbar);

function bukaSearch(){

    document.getElementById("searchOverlay").style.display = "block";

    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.touchZoom.disable();

    document.getElementById("searchInput").focus();
    tutupSheet();

}

function tutupSearch(){

    document.getElementById("searchOverlay").style.display = "none";

    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.touchZoom.enable();

}

function cariUMKM() {

    const keyword = document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();

    const hasil = document.getElementById("hasilSearch");

    hasil.innerHTML = "";

    if (keyword === "") return;

    if (!navigator.geolocation) {
        hasil.innerHTML = "<div class='hasil-item'>Browser tidak mendukung lokasi.</div>";
        return;
    }

    navigator.geolocation.getCurrentPosition(function(pos){

        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;

        const hasilCari = daftarUMKM.filter(umkm => {

            const latFloat = parseFloat(String(umkm.Lat).replace(',', '.'));
            const lonFloat = parseFloat(String(umkm.Lon).replace(',', '.'));

            umkm.jarak = hitungJarak(userLat, userLon, latFloat, lonFloat);

            const nama = (umkm.Nama || "").toLowerCase();
            const Menu = (umkm.Menu || "").toLowerCase();

            return nama.includes(keyword) || Menu.includes(keyword);

        });

        hasilCari.sort((a,b) => a.jarak - b.jarak);

        hasilCari.forEach(function(umkm){

            hasil.innerHTML += `
                <div class="hasil-item"
                     onclick="zoomUMKM('${umkm.Nama}')">
                     

                    <b>${umkm.Nama}</b>
                    ${
                        umkm.Rekomendasi === "Ya"
                        ? `<img src="Rekomendasi.png" class="icon-rekomendasi" alt="Rekomendasi">`
                        : ""
                    }<br>
                    <small class="hasil-menu">
                        ${umkm.Menu || "Menu belum tersedia"}
                    </small><br>
                    <small>📍 ${umkm.jarak.toFixed(2)} km</small> 

                </div>
            `;

        });

    });

}

// Lokasi sekarang

let markerLokasi = null;
function lokasiSaya() {

    if (!navigator.geolocation) {
        alert("Browser Anda tidak mendukung lokasi.");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        function(pos){

            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            // Hapus marker lama
            if(markerLokasi){
                map.removeLayer(markerLokasi);
            }

            markerLokasi = L.circleMarker([lat, lon],{

                radius:8,
                color:"#fff",
                weight:3,

                fillColor:"#007bff",
                fillOpacity:1

            })
            .addTo(map)
            

            map.setView([lat, lon], 20);

            markerLokasi.openPopup();

        },

        function(error){
            alert(error.message);
        }

    );

}

map.on("zoomend", function () {

    const zoom = map.getZoom();

    // Marker UMKM
    daftarUMKM.forEach(function(umkm){

        if (!umkm.marker) return;

        if (zoom < 15) {

            if (map.hasLayer(umkm.marker)) {
                map.removeLayer(umkm.marker);
            }

        } else {

            if (!map.hasLayer(umkm.marker)) {
                umkm.marker.addTo(map);
            }

        }

    });

    // Marker lokasi pengguna
    if (markerLokasi) {

        if (zoom < 15) {

            if (map.hasLayer(markerLokasi)) {
                map.removeLayer(markerLokasi);
            }

        } else {

            if (!map.hasLayer(markerLokasi)) {
                markerLokasi.addTo(map);
            }

        }

    }

});

map.on("zoomend", function(){

    const zoom = map.getZoom();

    daftarUMKM.forEach(function(umkm){

        if(!umkm.marker) return;

        if(zoom >= 18){

            umkm.marker.bindTooltip(umkm.Nama,{
                permanent:true,
                direction:"left",
                offset:[-14,-20],
                className:"nama-umkm"
            });

            umkm.marker.openTooltip();

        }else{

            umkm.marker.closeTooltip();

        }

    });

});


function bukaSheet(html){

    document.getElementById("sheetContent").innerHTML = html;

    const sheet = document.getElementById("bottomSheet");

    sheet.classList.remove("hide");
    sheet.classList.add("show");

}

function tutupSheet(){

    const sheet = document.getElementById("bottomSheet");

    sheet.classList.remove("show");
    sheet.classList.add("hide");

}

const sheet = document.getElementById("bottomSheet");

let startY = 0;
let currentY = 0;
let dragging = false;

sheet.addEventListener("pointerdown", function(e){

    dragging = true;
    startY = e.clientY;

    sheet.style.transition = "none";

});

window.addEventListener("pointermove", function(e){

    if(!dragging) return;

    currentY = e.clientY - startY;

    if(currentY > 0){
        sheet.style.transform = `translateY(${currentY}px)`;
    }

});

window.addEventListener("pointerup", function(){

    if(!dragging) return;

    dragging = false;

    sheet.style.transition = "transform .3s ease";

    if(currentY > 120){

        tutupSheet();

    }else{

        sheet.style.transform = "";

    }

    currentY = 0;

});

function lihatFoto(link){

    document.getElementById("fotoBesar").src = link;

    document.getElementById("fotoOverlay").style.display = "flex";

}

function tutupFoto(){

    document.getElementById("fotoOverlay").style.display = "none";

}

function tampilkanRekomendasi(){

    navigator.geolocation.getCurrentPosition(function(pos){

        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        daftarUMKM.forEach(function(umkm){

            umkm.jarak = hitungJarak(
                lat,
                lon,
                umkm.Lat,
                umkm.Lon
            );

        });

        const rekomendasi = daftarUMKM
            .filter(umkm => umkm.Rekomendasi === "Ya")
            .sort((a,b) => a.jarak - b.jarak);

        tampilkanDaftar(rekomendasi);

    });

}