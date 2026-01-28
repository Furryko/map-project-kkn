// ========================================
// PETA DIGITAL DESA GENDEREH
// File: js/main.js - VERSI FINAL
// ========================================

const ZOOM_AWAL = 14;
const ZOOM_DETAIL = 16;

const map = L.map('map').setView([-6.9, 107.8], ZOOM_AWAL);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// ========== WARNA BERDASARKAN RW ==========
const colorByRW = {
    '01': '#FFE082',
    '02': '#FFAB91',
    '03': '#A5D6A7',
    '04': '#66BB6A'
};

let kantorDesaCoords = null;
let batasDesaLayer = null;  // Variable untuk simpan layer batas desa

// ========================================
// 1. LOAD BATAS DESA (FIT BOUNDS OTOMATIS)
// ========================================
fetch('data/batas_desa.json')
    .then(response => response.json())
    .then(data => {
        batasDesaLayer = L.geoJSON(data, {
            style: {
                color: '#e74c3c',
                weight: 4,
                fillOpacity: 0,
                dashArray: '10, 5'
            },
            onEachFeature: (feature, layer) => {
                const nama = feature.properties.NAMOBJ || feature.properties.NAMA || 'Batas Desa Gendereh';
                layer.bindPopup(`<b>${nama}</b>`);
            }
        }).addTo(map);
        
        // AUTO FIT BOUNDS KE BATAS DESA
        map.fitBounds(batasDesaLayer.getBounds(), {
            padding: [50, 50]  // Padding 50px dari tepi peta
        });
        
        console.log('✓ Batas Desa loaded & peta auto fit bounds');
    })
    .catch(error => console.error('❌ Error loading batas_desa.json:', error));

// ========================================
// 2. LOAD RT/RW (AUTO DETECT FIELD RW)
// ========================================
fetch('data/rt_rw.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: function(feature) {
                const props = feature.properties;
                
                let rwNumber = props.RW || props.rw || null;
                
                if (rwNumber) {
                    rwNumber = rwNumber.toString();
                    if (rwNumber.length === 1) {
                        rwNumber = '0' + rwNumber;
                    }
                }
                
                const fillColor = colorByRW[rwNumber] || '#BDBDBD';
                
                const namobj = props.NAMOBJ || 'RT';
                console.log(`${namobj} → RW ${rwNumber || 'null'} → ${fillColor}`);
                
                return {
                    color: '#2c3e50',
                    weight: 2,
                    fillColor: fillColor,
                    fillOpacity: 0.7
                };
            },
            onEachFeature: function(feature, layer) {
                const props = feature.properties;
                const namobj = props.NAMOBJ || 'RT';
                const rwNumber = props.RW || props.rw || '?';
                
                layer.bindPopup(`
                    <div class="popup-content">
                        <h3>${namobj}</h3>
                        <p><b>RW ${rwNumber}</b></p>
                    </div>
                `);
                
                layer.on('mouseover', function() {
                    this.setStyle({ weight: 4, fillOpacity: 0.9 });
                });
                layer.on('mouseout', function() {
                    this.setStyle({ weight: 2, fillOpacity: 0.7 });
                });
            }
        }).addTo(map);
        
        console.log('✓ RT/RW loaded (auto detect field RW)');
    })
    .catch(error => console.error('❌ Error loading rt_rw.geojson:', error));

// ========================================
// 3. LOAD KANTOR DESA
// ========================================
fetch('data/kantor_desa.json')
    .then(response => response.json())
    .then(data => {
        const iconKantor = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        
        L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
                kantorDesaCoords = latlng;
                return L.marker(latlng, { icon: iconKantor });
            },
            onEachFeature: (feature, layer) => {
                const p = feature.properties;
                const nama = p.NAMA || p.nama || p.NAMOBJ || 'Kantor Desa Gendereh';
                const alamat = p.ALAMAT || p.alamat || '';
                const kontak = p.KONTAK || p.kontak || '';
                
                let popup = `<div class="popup-content"><h3>${nama}</h3>`;
                if (alamat) popup += `<p><i class="fas fa-map-marker-alt"></i> ${alamat}</p>`;
                if (kontak) popup += `<p><i class="fas fa-phone"></i> ${kontak}</p>`;
                popup += `</div>`;
                
                layer.bindPopup(popup);
            }
        }).addTo(map);
        
        console.log('✓ Kantor Desa loaded');
    })
    .catch(error => console.error('❌ Error loading kantor_desa.json:', error));

// ========================================
// 4. LEGEND
// ========================================
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function() {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
        <h4>Keterangan Batas RW</h4>
        <div class="legend-item"><span style="background: #FFE082;"></span> Wilayah RW 01</div>
        <div class="legend-item"><span style="background: #FFAB91;"></span> Wilayah RW 02</div>
        <div class="legend-item"><span style="background: #A5D6A7;"></span> Wilayah RW 03</div>
        <div class="legend-item"><span style="background: #66BB6A;"></span> Wilayah RW 04</div>
    `;
    return div;
};
legend.addTo(map);

// ========================================
// 5. BUTTON ZOOM
// ========================================

// Button 1: Zoom ke Kantor Desa (detail)
document.getElementById('zoom-gendereh').addEventListener('click', () => {
    if (kantorDesaCoords) {
        map.setView(kantorDesaCoords, ZOOM_DETAIL);
        console.log('🎯 Zoom ke Kantor Desa');
    }
});

// Button 2: Zoom ke seluruh batas desa (luas)
document.getElementById('zoom-all').addEventListener('click', () => {
    if (batasDesaLayer) {
        map.fitBounds(batasDesaLayer.getBounds(), { padding: [50, 50] });
        console.log('🗺️ Zoom ke seluruh wilayah desa');
    }
});


// ========================================
// 6. SMOOTH SCROLL
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    });
});

console.log('🗺️ Peta Digital Desa Gendereh - Ready!');
