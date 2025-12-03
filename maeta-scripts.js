// =======================================================
// เนื้อหาทั้งหมดในไฟล์ maeta-scripts.js (ฉบับสมบูรณ์)
// =======================================================

// 1. Firebase Configuration (ต้องอยู่บนสุด)
const firebaseConfig = {
    apiKey: "AIzaSyB_qylditvP3Cxt7JECSRtP66dDWazYxBA",
    authDomain: "nt-engineering-data.firebaseapp.com",
    databaseURL: "https://nt-engineering-data-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nt-engineering-data",
    storageBucket: "nt-engineering-data.firebasestorage.app",
    messagingSenderId: "232559601242",
    appId: "1:232559601242:web:4730822ac59c40e2d35a63"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); 
console.log("✅ Firebase initialized!");

// 🔥 Cloudinary Configuration (ถูกเพิ่มกลับเข้ามาเพื่อแก้ ReferenceError)
// ⚠️ กรุณาแก้ไขค่าเหล่านี้ด้วยข้อมูลจาก Cloudinary ของคุณ
const CLOUDINARY_CONFIG = {
    cloudName: 'dtsx2jqzl',      // ⬅️ แก้ไข Cloud Name ของคุณที่นี่
    uploadPreset: 'nt_engineering', // ⬅️ แก้ไข Upload Preset ของคุณที่นี่
    folder: 'nt-engineering/maeta', // โฟลเดอร์ใน Cloudinary
    maxFiles: 10
};


// ⚠️ อ้างอิง Document ของสถานีแม่ทา (Collection: 'maeta_location', Document ID: 'main')
const MAETA_DOC_REF = db.collection('maeta_location').doc('main');

// ตัวแปรเก็บข้อมูลรูปภาพปัจจุบัน (จะถูกโหลดจาก Firebase)
let currentModalImages = [];

// 2. ฟังก์ชันดึงข้อมูลจาก Firestore และนับจำนวน
async function loadEquipmentCounts() {
    try {
        const snapshot = await db.collection('equipment').get();
        
        const counts = {
            air: 0, battery: 0, generator: 0, transformer: 0, rectifier: 0, pea: 0, solar: 0
        };
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const type = data.type; 
            
            if (counts.hasOwnProperty(type)) {
                counts[type]++;
            }
        });
        
        if (document.getElementById('count-air')) document.getElementById('count-air').textContent = counts.air;
        if (document.getElementById('count-transformer')) document.getElementById('count-transformer').textContent = counts.transformer;
        if (document.getElementById('count-generator')) document.getElementById('count-generator').textContent = counts.generator;
        if (document.getElementById('count-battery')) document.getElementById('count-battery').textContent = counts.battery;
        
    } catch (error) {
        console.error('❌ Error loading equipment counts:', error);
    }
}

// NEW: Helper function สำหรับควบคุมการแสดงผล UI (Placeholder vs. Data)
function toggleLocationUI(dataType, hasData, dataValue) {
    const placeholder = document.getElementById(dataType + '-placeholder');
    const display = document.getElementById(dataType + '-display');
    const mapFrame = document.getElementById('mapFrame');
    const mapPlaceholder = document.getElementById('map-placeholder');
    
    if (dataType === 'coord') {
        if (hasData) {
            if (placeholder) placeholder.style.display = 'none';
            if (display) display.style.display = 'block';
            if (mapFrame) mapFrame.style.display = 'block';
            if (mapPlaceholder) mapPlaceholder.style.display = 'none';
            if (display) display.querySelector('div').textContent = dataValue;
        } else {
            if (placeholder) placeholder.style.display = 'flex'; // แสดง +
            if (display) display.style.display = 'none';
            if (mapFrame) mapFrame.style.display = 'none';
            if (mapPlaceholder) mapPlaceholder.style.display = 'flex';
        }
    } else if (dataType === 'address') {
        if (hasData) {
            if (placeholder) placeholder.style.display = 'none';
            if (display) display.style.display = 'block';
            if (display) display.textContent = dataValue;
        } else {
            if (placeholder) placeholder.style.display = 'flex'; // แสดง +
            if (display) display.style.display = 'none';
            if (display) display.textContent = 'ยังไม่มีข้อมูล';
        }
    }
}

// 3. ฟังก์ชันดึงข้อมูลที่อยู่ พิกัด และรูปภาพของสถานีมาแสดง
async function loadMaetaData() {
    try {
        const doc = await MAETA_DOC_REF.get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log("✅ Maeta data loaded from Firestore:", data);

            // 1. Update Address UI
            const address = data.address && data.address !== '-' ? data.address : null;
            toggleLocationUI('address', !!address, address);

            // 2. Update Coordinate UI
            const hasCoord = data.latitude && data.longitude && data.latitude !== '' && data.longitude !== '';
            if (hasCoord) {
                const coordText = `สพ/ช : ${data.latitude}.${data.longitude}`;
                toggleLocationUI('coord', true, coordText);
                // 💡 แก้ไข: ใช้ URL Google Map ที่ถูกต้อง
                document.getElementById('mapFrame').src = `https://maps.google.com/maps?q=${data.latitude},${data.longitude}&z=15&output=embed`;
            } else {
                toggleLocationUI('coord', false, null);
                document.getElementById('mapFrame').src = '';
            }

            // 3. Update Image Gallery (UI and local array)
            currentModalImages = data.images ? data.images.map(img => {
                // 💡 แก้ไข: จัดการ URL ที่หายไปให้ใช้ Placeholder ที่ใช้งานได้จริง
                const finalUrl = (img.url && !img.url.startsWith('data:image')) 
                                    ? img.url 
                                    : `https://via.placeholder.com/150/999999?text=${img.name ? img.name.replace(/\s/g, '+') : 'No+URL'}`;

                return {
                    id: img.id,
                    date: img.date,
                    name: img.name,
                    url: finalUrl // ใช้ URL ที่ถูกตรวจสอบแล้ว
                };
            }) : [];
            updateMainGalleryUI(); 
        } else {
            // Document ไม่พบ - แสดง Placeholder ทั้งหมด
            toggleLocationUI('address', false, null);
            toggleLocationUI('coord', false, null);
            updateMainGalleryUI(); 
        }
    } catch (error) {
        console.error("❌ Error loading Maeta data:", error);
    }
}


// 4. Toggle Sidebar และ Submenu
const toggleBtn = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const body = document.body;

if (window.innerWidth <= 768) {
    sidebar.classList.add('collapsed');
    body.classList.add('sidebar-collapsed');
}

toggleBtn.addEventListener('click', function() {
    sidebar.classList.toggle('collapsed');
    body.classList.toggle('sidebar-collapsed');
    
    if (window.innerWidth <= 768) {
        body.classList.toggle('sidebar-open');
        overlay.classList.toggle('active');
    }
    
    const icon = this.querySelector('i');
    if (sidebar.classList.contains('collapsed')) {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    } else {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    }
});

overlay.addEventListener('click', function() {
    sidebar.classList.add('collapsed');
    body.classList.remove('sidebar-collapsed');
    body.classList.remove('sidebar-open');
    overlay.classList.remove('active');
    
    const icon = toggleBtn.querySelector('i');
    icon.classList.remove('fa-times');
    icon.classList.add('fa-bars');
});

document.querySelectorAll('.menu-item[data-submenu]').forEach(item => {
    const submenuId = item.getAttribute('data-submenu');
    const submenu = document.getElementById(submenuId);
    
    item.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('active');
        submenu.classList.toggle('show');
    });
});

document.querySelectorAll('.menu-sub-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.menu-sub-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});


// 5. ข้อมูลจังหวัด อำเภอ ตำบล
const locationData = {
    'ลำพูน': {
        'เมืองลำพูน': ['ในเมือง', 'ประตูป่า', 'ต้นธง', 'ศรีบัวบาน', 'เหมืองง่า'],
        'แม่ทา': ['ศาลเมิง', 'แม่ทา', 'ทาสบเส้า', 'ทาขุมเงิน'],
        'ลี้': ['ลี้', 'ดงดำ', 'ก้อ', 'แม่ตืน'],
        'ป่าซาง': ['ป่าซาง', 'แม่แรง', 'ม่วงน้อย', 'บ้านเรือน']
    },
    'เชียงใหม่': {
        'เมืองเชียงใหม่': ['ศรีภูมิ', 'ช้างคลาน', 'หนองหอย', 'ช้างเผือก'],
        'สันทราย': ['สันทรายหลวง', 'สันทรายน้อย', 'หนองแหย่ง', 'แม่แฝก'],
        'แม่ริม': ['แม่ริม', 'สันโป่ง', 'ดอนแก้ว', 'ขี้เหล็ก'],
        'หางดง': ['หางดง', 'หนองแก๋ว', 'สบแม่ข่า', 'บ้านแหวน']
    }
};


// 6. ฟังก์ชันแก้ไขและลบที่อยู่
function editAddress() {
    const currentAddress = document.getElementById('addressContent').textContent.trim();
    
    const modalHTML = `
        <div id="addressModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <h3 style="margin: 0 0 20px 0;">ที่อยู่ (ระบะละเอียด)</h3>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">ที่อยู่</label>
                    <textarea id="addressDetail" rows="3" style="
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        font-size: 14px;
                        font-family: inherit;
                    " placeholder="กรอกที่อยู่รายละเอียด...">${currentAddress}</textarea>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">ซอย/หมู่</label>
                    <input type="text" id="soi" style="
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        font-size: 14px;
                    " placeholder="เช่น หมู่ 3, ซอย 5">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">จังหวัด</label>
                    <select id="province" onchange="updateAmphoe()" style="
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        font-size: 14px;
                    ">
                        <option value="">เลือกจังหวัด</option>
                        <option value="ลำพูน">ลำพูน</option>
                        <option value="เชียงใหม่">เชียงใหม่</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">อำเภอ</label>
                    <select id="amphoe" onchange="updateTambon()" style="
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        font-size: 14px;
                    " disabled>
                        <option value="">เลือกอำเภอ</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">ตำบล</label>
                    <select id="tambon" style="
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        font-size: 14px;
                    " disabled>
                        <option value="">เลือกตำบล</option>
                    </select>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="closeAddressModal()" style="
                        padding: 10px 20px;
                        background: #ddd;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    ">ยกเลิก</button>
                    <button onclick="saveAddress()" style="
                        padding: 10px 20px;
                        background: #FFD101;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: 600;
                    ">บันทึก</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    parseAndSetAddress(currentAddress);
}

function parseAndSetAddress(address) {
    const provinceMatch = address.match(/จ\.(\S+)/);
    const amphoeMatch = address.match(/อ\.(\S+)/);
    const tambonMatch = address.match(/ต\.(\S+)/);
    const soiMatch = address.match(/(ม\.\d+|ซอย\s*\S+)/);
    
    if (provinceMatch) {
        const province = provinceMatch[1];
        const provinceSelect = document.getElementById('province');
        if (provinceSelect) {
            provinceSelect.value = province;
            updateAmphoe();
            
            setTimeout(() => {
                const amphoeSelect = document.getElementById('amphoe');
                if (amphoeMatch && amphoeSelect) {
                    const amphoe = amphoeMatch[1];
                    amphoeSelect.value = amphoe;
                    updateTambon();
                    
                    setTimeout(() => {
                        const tambonSelect = document.getElementById('tambon');
                        if (tambonMatch && tambonSelect) {
                            tambonSelect.value = tambonMatch[1];
                        }
                    }, 50);
                }
            }, 50);
        }
    }
    
    const soiInput = document.getElementById('soi');
    if (soiMatch && soiInput) {
        soiInput.value = soiMatch[1];
    }
}

function updateAmphoe() {
    const province = document.getElementById('province').value;
    const amphoeSelect = document.getElementById('amphoe');
    const tambonSelect = document.getElementById('tambon');
    
    if (!amphoeSelect || !tambonSelect) return;
    
    amphoeSelect.innerHTML = '<option value="">เลือกอำเภอ</option>';
    tambonSelect.innerHTML = '<option value="">เลือกตำบล</option>';
    tambonSelect.disabled = true;
    
    if (province && locationData[province]) {
        amphoeSelect.disabled = false;
        const amphoes = Object.keys(locationData[province]);
        amphoes.forEach(amphoe => {
            const option = document.createElement('option');
            option.value = amphoe;
            option.textContent = amphoe;
            amphoeSelect.appendChild(option);
        });
    } else {
        amphoeSelect.disabled = true;
    }
}

function updateTambon() {
    const province = document.getElementById('province').value;
    const amphoe = document.getElementById('amphoe').value;
    const tambonSelect = document.getElementById('tambon');
    
    if (!tambonSelect) return;
    
    tambonSelect.innerHTML = '<option value="">เลือกตำบล</option>';
    
    if (province && amphoe && locationData[province] && locationData[province][amphoe]) {
        tambonSelect.disabled = false;
        const tambons = locationData[province][amphoe];
        tambons.forEach(tambon => {
            const option = document.createElement('option');
            option.value = tambon;
            option.textContent = tambon;
            tambonSelect.appendChild(option);
        });
    } else {
        tambonSelect.disabled = true;
    }
}

function closeAddressModal() {
    const modal = document.getElementById('addressModal');
    if (modal) modal.remove();
}

async function saveAddress() {
    const detail = document.getElementById('addressDetail').value;
    const soi = document.getElementById('soi').value;
    const tambon = document.getElementById('tambon').value;
    const amphoe = document.getElementById('amphoe').value;
    const province = document.getElementById('province').value;
    
    let fullAddress = [];
    if (detail) fullAddress.push(detail);
    if (soi) fullAddress.push(soi);
    if (tambon) fullAddress.push(`ต.${tambon}`);
    if (amphoe) fullAddress.push(`อ.${amphoe}`);
    if (province) fullAddress.push(`จ.${province}`);
    
    const addressText = fullAddress.join(' ') || '-';
    
    try {
        await MAETA_DOC_REF.set({
            address: addressText
        }, { merge: true }); 
        
        // ควบคุม UI หลังบันทึก
        toggleLocationUI('address', !!addressText && addressText !== '-', addressText);
        closeAddressModal();
        alert('✅ บันทึกที่อยู่สำเร็จและอัปเดต Firebase แล้ว');
    } catch (error) {
        console.error('Error saving address in Firestore:', error);
        alert('❌ เกิดข้อผิดพลาดในการบันทึกที่อยู่: ' + error.message);
    }
}

async function deleteAddress() {
    if (confirm('ต้องการลบที่อยู่หรือไม่? การกระทำนี้จะลบข้อมูลออกจาก Firebase ด้วย')) {
        try {
            await MAETA_DOC_REF.set({
                address: '-'
            }, { merge: true }); 
            
            // ควบคุม UI หลังลบ
            toggleLocationUI('address', false, null);
            alert('✅ ลบที่อยู่สำเร็จและอัปเดต Firebase แล้ว');
        } catch (error) {
            console.error('Error deleting address in Firestore:', error);
            alert('❌ เกิดข้อผิดพลาดในการลบที่อยู่: ' + error.message);
        }
    }
}


// 7. ฟังก์ชันแก้ไขและลบพิกัด
function editCoordinate() {
    const currentCoordText = document.getElementById('coordinateContent').textContent.trim();
    let lat = '';
    let lng = '';
    
    const matches = currentCoordText.match(/([\-]?\d+\.\d+)\.([\-]?\d+\.\d+)/);
    if (matches && matches.length === 3) {
        lat = matches[1]; 
        lng = matches[2]; 
    }

    const modalHTML = `
        <div id="coordinateModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <h3 style="margin: 0 0 20px 0;">รายละเอียดพิกัด</h3>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">พิกัด (Lat,Long)</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="coordLat" value="${lat}" style="
                            flex: 1;
                            padding: 10px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            font-size: 14px;
                        " placeholder="Lat (ละติจูด)">
                        <input type="text" id="coordLng" value="${lng}" style="
                            flex: 1;
                            padding: 10px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            font-size: 14px;
                        " placeholder="Long (ลองจิจูด)">
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 600;">ตำแหน่งบนแผนที่</label>
                    <div class="map-container-modal" style="position: relative; height: 250px; border-radius: 8px; overflow: hidden; background: #eee;">
                        <iframe 
                            id="modalMapFrame"
                            src=""
                            frameborder="0" 
                            style="border:0; width:100%; height:100%;"
                            allowfullscreen>
                        </iframe>
                        <div id="loadingMap" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; font-weight: 600;">กำลังโหลดแผนที่...</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="closeCoordinateModal()" style="
                        padding: 10px 20px;
                        background: #ddd;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    ">ยกเลิก</button>
                    <button onclick="saveCoordinate()" style="
                        padding: 10px 20px;
                        background: #FFD101;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: 600;
                    ">บันทึก</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    updateModalMap(lat, lng);
    
    document.getElementById('coordLat').addEventListener('input', function() {
        updateModalMap(this.value, document.getElementById('coordLng').value);
    });
    document.getElementById('coordLng').addEventListener('input', function() {
        updateModalMap(document.getElementById('coordLat').value, this.value);
    });
}

function closeCoordinateModal() {
    const modal = document.getElementById('coordinateModal');
    if (modal) modal.remove();
}

async function saveCoordinate() {
    const lat = document.getElementById('coordLat').value.trim();
    const lng = document.getElementById('coordLng').value.trim();
    
    if (lat && lng) {
        try {
            await MAETA_DOC_REF.set({
                latitude: lat,
                longitude: lng
            }, { merge: true });
            
            const coordText = `สพ/ช : ${lat}.${lng}`;
            // ควบคุม UI หลังบันทึก
            toggleLocationUI('coord', true, coordText);
            // 💡 แก้ไข: ใช้ URL Google Map ที่ถูกต้อง
            document.getElementById('mapFrame').src = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

            closeCoordinateModal();
            alert('✅ บันทึกพิกัดสำเร็จและอัปเดต Firebase แล้ว');
        } catch (error) {
            console.error('Error saving coordinate in Firestore:', error);
            alert('❌ เกิดข้อผิดพลาดในการบันทึกพิกัด: ' + error.message);
        }
    } else {
        alert('❌ กรุณากรอกทั้ง Latitude และ Longitude');
    }
}

function updateModalMap(lat, lng) {
    const mapFrame = document.getElementById('modalMapFrame');
    const loadingMap = document.getElementById('loadingMap');
    
    if (!mapFrame || !loadingMap) return;
    
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
        loadingMap.style.display = 'flex'; 
        
        // 💡 แก้ไข: ใช้ URL Google Map ที่ถูกต้อง
        const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
        
        mapFrame.src = mapUrl;
        
        mapFrame.onload = function() {
            loadingMap.style.display = 'none';
        }
        
        setTimeout(() => loadingMap.style.display = 'none', 1000); 
        
    } else {
        mapFrame.src = ''; 
        loadingMap.textContent = 'กรุณาใส่ค่า Latitude และ Longitude ที่ถูกต้อง';
        loadingMap.style.display = 'flex';
    }
}

async function deleteCoordinate() {
    if (confirm('ต้องการลบพิกัดหรือไม่? การกระทำนี้จะลบข้อมูลออกจาก Firebase ด้วย')) {
        try {
            await MAETA_DOC_REF.set({
                latitude: '',
                longitude: ''
            }, { merge: true });
            
            // ควบคุม UI หลังลบ
            toggleLocationUI('coord', false, null);
            document.getElementById('mapFrame').src = '';
            alert('✅ ลบพิกัดสำเร็จและอัปเดต Firebase แล้ว');
        } catch (error) {
            console.error('Error deleting coordinate in Firestore:', error);
            alert('❌ เกิดข้อผิดพลาดในการลบพิกัด: ' + error.message);
        }
    }
}


// 8. Image Gallery Modal Functions
function createImageItemHTML(image) {
    const imageName = image.name ? image.name.substring(0, 15) : 'img_untitled';
    const imageDate = image.date || new Date().toLocaleDateString('th-TH');
    
    // 💡 NEW: ใช้ URL ที่ถูกตรวจสอบแล้ว (img.url คือ finalUrl จาก loadMaetaData)
    const imageSource = image.url; 
    
    return `
        <div class="modal-gallery-item" data-id="${image.id}">
            <img src="${imageSource}" alt="${imageName}">
            <button class="delete-icon" onclick="deleteModalImage('${image.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `;
}

function openImageGalleryModal() {
    let imagesHTML = currentModalImages.map(createImageItemHTML).join('');
    
    imagesHTML += `
        <div class="modal-gallery-item modal-upload-placeholder" onclick="openCloudinaryWidget()">
            <i class="fas fa-plus"></i>
        </div>
    `;
    
    const modalHTML = `
        <div id="imageGalleryModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                width: 90%;
                max-width: 700px;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <h3 style="margin: 0 0 20px 0;">รายละเอียดรูปภาพ</h3>
                
                <div class="image-gallery-modal" id="modalImageGrid">
                    ${imagesHTML}
                </div>
                
                <input type="file" id="imageUploadInput" accept="image/*" multiple style="display: none;" onchange="handleImageUpload(event)">
                
                <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: flex-end;" class="modal-footer">
                    <button class="cancel-btn" onclick="closeImageGalleryModal()">ยกเลิก</button>
                    <button class="save-btn" onclick="saveImageGallery()">บันทึก</button>
                </div>
            </div>
        </div>
    `;
    
    if (document.body) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } else {
        console.error("❌ Cannot open modal: document.body is not available.");
    }
}

function closeImageGalleryModal() {
    const modal = document.getElementById('imageGalleryModal');
    if (modal) modal.remove();
}

// 💡 NEW: ฟังก์ชันเปิด Cloudinary Widget (ถูกผูกกับปุ่ม + Add)
function openCloudinaryWidget() {
    // ⚠️ ตรวจสอบว่าใส่ค่า Config แล้วหรือยัง
    if (CLOUDINARY_CONFIG.cloudName === 'YOUR_CLOUD_NAME_HERE' || 
        CLOUDINARY_CONFIG.uploadPreset === 'YOUR_UPLOAD_PRESET_HERE') {
        alert('⚠️ กรุณาแก้ไข CLOUDINARY_CONFIG ใน maeta-scripts.js ก่อน');
        return;
    }
    
    if (typeof cloudinary === 'undefined') {
        alert('❌ Cloudinary library ยังไม่ถูกโหลด');
        return;
    }
    
    const widget = cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CONFIG.cloudName,
        uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
        folder: CLOUDINARY_CONFIG.folder,
        multiple: true,
        maxFiles: CLOUDINARY_CONFIG.maxFiles - currentModalImages.length, 
        sources: ['local', 'camera'],
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        styles: {
            palette: {
                window: "#FFFFFF",
                tabIcon: "#FFD101",
                link: "#4285f4",
                action: "#FFD101",
            }
        }
    }, (error, result) => {
        if (result && result.event === 'success') {
            const uploadedUrl = result.info.secure_url;
            const newImage = { 
                id: 'cld_' + result.info.public_id, 
                url: uploadedUrl, 
                name: result.info.original_filename + '.' + result.info.format, 
                date: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'numeric', day: 'numeric' })
            };
            
            // 💾 เพิ่ม URL จริงที่ได้จาก Cloudinary ลงใน Array ชั่วคราว
            currentModalImages.push(newImage);
            
            // 🔄 อัปเดต UI ใน Modal และรีเฟรช Modal
            updateModalGrid();
        }
        
        if (error) {
            console.error('Upload error:', error);
        }
    });
    
    widget.open();
}

// ฟังก์ชันนี้ไม่ถูกใช้แล้ว (แทนที่ด้วย Cloudinary Widget)
async function handleImageUpload(event) {
    // โค้ดถูกแทนที่ด้วย openCloudinaryWidget
}

function updateModalGrid() {
    const grid = document.getElementById('modalImageGrid');
    if (!grid) return;
    
    let imagesHTML = currentModalImages.map(createImageItemHTML).join('');
    
    imagesHTML += `
        <div class="modal-gallery-item modal-upload-placeholder" onclick="openCloudinaryWidget()">
            <i class="fas fa-plus"></i>
        </div>
    `;
    grid.innerHTML = imagesHTML;
}

function deleteModalImage(id) {
    if (confirm('ต้องการลบรูปภาพนี้หรือไม่?')) {
        currentModalImages = currentModalImages.filter(img => img.id !== id);
        updateModalGrid();
    }
}

// Helper function to render the main image gallery UI based on currentModalImages
function updateMainGalleryUI() {
    const mainGallery = document.getElementById('imageGalleryContainer').querySelector('.image-gallery');
    const imagePlaceholder = document.getElementById('image-placeholder');
    
    if (currentModalImages.length > 0) {
        // แสดงข้อมูลจริง
        if (mainGallery) mainGallery.style.display = 'grid';
        if (imagePlaceholder) imagePlaceholder.style.display = 'none';
        
        const newMainGalleryHTML = currentModalImages.map(img => {
            const imageSource = img.url; 
            
            return `
                <div class="gallery-item" data-id="${img.id}">
                    <img src="${imageSource}" 
                         alt="Image" 
                         onclick="openImageLightbox('${imageSource}')" 
                         style="cursor: pointer;">
                         
                    <div class="image-info">
                        <div>${img.name ? img.name.substring(0, 15) : '#img_untitled'}</div>
                        <div class="image-date">${img.date || new Date().toLocaleDateString('th-TH')}</div>
                    </div>
                    <button class="delete-icon"><i class="fas fa-trash"></i></button> 
                </div>
            `;
        }).join('');
        
        if (mainGallery) mainGallery.innerHTML = newMainGalleryHTML;
        initMainGalleryListeners();
    } else {
        // แสดง Placeholder
        if (mainGallery) mainGallery.style.display = 'none';
        if (imagePlaceholder) imagePlaceholder.style.display = 'flex'; // แสดง Placeholder รูปดาวน์โหลด
    }
}

// ฟังก์ชันผูก Event Listener ให้ปุ่มลบใน Gallery หลัก
function initMainGalleryListeners() {
    document.querySelectorAll('#imageGalleryContainer .gallery-item .delete-icon').forEach(button => {
        const newButton = button.cloneNode(true);
        button.replaceWith(newButton);
    });

    document.querySelectorAll('#imageGalleryContainer .gallery-item .delete-icon').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.closest('.gallery-item').getAttribute('data-id');
            if (itemId) {
                deleteImageFromMainGallery(itemId);
            }
        });
    });
}

async function saveImageGallery() {
    try {
        // 1. เตรียมข้อมูลสำหรับ Firestore: ลบ Data URL ชั่วคราวออก
        const imagesToSave = currentModalImages.map(img => {
            const cleanImg = { ...img };
            // ตรวจสอบว่า URL เป็น Placeholder ชั่วคราวหรือไม่
            if (cleanImg.url && cleanImg.url.includes('via.placeholder.com')) {
                // ถ้าเป็น Placeholder ให้ลบออกก่อนบันทึก
                delete cleanImg.url; 
            }
            return cleanImg;
        }).filter(img => img.id); // กรองเฉพาะรูปที่มี ID

        // 2. บันทึกข้อมูลลง Firebase
        await MAETA_DOC_REF.set({
            images: imagesToSave 
        }, { merge: true });

        // 3. อัปเดต UI และแจ้งผล
        updateMainGalleryUI();
        closeImageGalleryModal();
        alert('✅ บันทึกรูปภาพสำเร็จและอัปเดต Firebase แล้ว');

    } catch (error) {
        console.error('Error saving image gallery to Firestore:', error);
        alert('❌ เกิดข้อผิดพลาดในการบันทึกรูปภาพ: ' + error.message);
    }
}

async function deleteImageFromMainGallery(id) {
    if (confirm('ต้องการลบรูปภาพนี้ออกจากหน้าหลักหรือไม่? การกระทำนี้จะลบข้อมูลออกจาก Firebase ด้วย')) {
        currentModalImages = currentModalImages.filter(img => img.id !== id); 
        
        try {
            // เตรียมข้อมูลบันทึก (เหมือน saveImageGallery)
            const imagesToSave = currentModalImages.map(img => {
                const cleanImg = { ...img };
                if (cleanImg.url && cleanImg.url.includes('via.placeholder.com')) {
                    delete cleanImg.url; 
                }
                return cleanImg;
            }).filter(img => img.id);

            await MAETA_DOC_REF.set({
                images: imagesToSave
            }, { merge: true });
            
            const elementToRemove = document.querySelector(`.gallery-item[data-id="${id}"]`);
            if (elementToRemove) {
                elementToRemove.remove();
                alert('✅ ลบรูปภาพสำเร็จและอัปเดต Firebase แล้ว');
            }
        } catch (error) {
            console.error('Error deleting image from Firestore:', error);
            alert('❌ เกิดข้อผิดพลาดในการลบรูปภาพ: ' + error.message);
        }
    }
}

// ในส่วนของ Image Gallery Modal Functions

// ===== NEW: ฟังก์ชันเปิดรูปภาพเต็มจอ (Lightbox) =====
function openImageLightbox(imageUrl) {
    // ตรวจสอบว่า URL ถูกต้องหรือไม่ (ป้องกันการเปิด Placeholder URL)
    if (!imageUrl || imageUrl.includes('via.placeholder.com')) {
        alert('❌ ไม่สามารถดูรูปภาพขนาดใหญ่ได้: URL รูปภาพไม่ถูกต้องหรือเป็น Placeholder');
        return;
    }
    
    const lightboxHTML = `
        <div id="imageLightbox" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            cursor: pointer;
        ">
            <img src="${imageUrl}" style="
                max-width: 90%;
                max-height: 90%;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                pointer-events: none; /* ป้องกันการคลิกบนรูปภาพไม่ให้ปิด Modal */
            ">
            <button id="closeLightboxBtn" style="
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(231, 76, 60, 0.9);
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 24px;
            ">✕</button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);

    // ผูก Event สำหรับปิด Lightbox
    const lightbox = document.getElementById('imageLightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            // ปิดเมื่อคลิกที่พื้นหลังหรือปุ่มปิด
            if (e.target.id === 'imageLightbox' || e.target.id === 'closeLightboxBtn' || e.target.closest('#closeLightboxBtn')) {
                 this.remove();
            }
        });
    }
}

// 9. โค้ดที่ทำงานเมื่อโหลดหน้าเว็บ
window.addEventListener('DOMContentLoaded', () => {
    loadEquipmentCounts();
    loadMaetaData(); 
});