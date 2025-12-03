// ========================================
// ⚠️ Firebase ถูก initialize แล้วใน index.html
// ตัวแปร db สามารถใช้ได้เลย
// ========================================

// ========================================
// 🔥 Cloudinary Configuration
// ⚠️ แก้ไขค่าเหล่านี้ด้วยข้อมูลจาก Cloudinary ของคุณ
// ========================================
const CLOUDINARY_CONFIG = {
    cloudName: 'dtsx2jqzl',      // ⬅️ แก้ตรงนี้ #1
    uploadPreset: 'nt_engineering', // ⬅️ แก้ตรงนี้ #2
    folder: 'nt-engineering/stations',
    maxFiles: 10
};

// ===== ฟังก์ชัน Toggle Sidebar =====
const toggleBtn = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const body = document.body;

// เริ่มต้นให้ sidebar เปิดบน Desktop, ปิดบนมือถือ
if (window.innerWidth <= 768) {
    sidebar.classList.add('collapsed');
    body.classList.add('sidebar-collapsed');
}

toggleBtn.addEventListener('click', function() {
    sidebar.classList.toggle('collapsed');
    body.classList.toggle('sidebar-collapsed');
    
    // สำหรับมือถือ - แสดง overlay
    if (window.innerWidth <= 768) {
        body.classList.toggle('sidebar-open');
        overlay.classList.toggle('active');
    }
    
    // เปลี่ยนไอคอนปุ่ม
    const icon = this.querySelector('i');
    if (sidebar.classList.contains('collapsed')) {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    } else {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    }
});

// ===== คลิก Overlay เพื่อปิด Sidebar (บนมือถือ) =====
overlay.addEventListener('click', function() {
    sidebar.classList.add('collapsed');
    body.classList.remove('sidebar-collapsed');
    body.classList.remove('sidebar-open');
    overlay.classList.remove('active');
    
    const icon = toggleBtn.querySelector('i');
    icon.classList.remove('fa-times');
    icon.classList.add('fa-bars');
});

// ===== เมนู Sidebar - เปลี่ยนสถานะ Active =====
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        // ปิด sidebar อัตโนมัติบนมือถือหลังคลิกเมนู
        if (window.innerWidth <= 768) {
            sidebar.classList.add('collapsed');
            body.classList.remove('sidebar-open');
            overlay.classList.remove('active');
            
            const icon = toggleBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
});

// ===== ฟังก์ชันค้นหาในตาราง =====
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchType = document.getElementById('searchType');

// ฟังก์ชันค้นหาหลัก
function performSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const type = searchType.value;
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let found = false;
        
        // กำหนดคอลัมน์ที่จะค้นหาตามประเภท
        let columnsToSearch = [];
        
        switch(type) {
            case 'all':
                columnsToSearch = [1, 2, 3, 4, 5, 6, 7];
                break;
            case 'code':
                columnsToSearch = [2];
                break;
            case 'shortname':
                columnsToSearch = [4];
                break;
            case 'thainame':
                columnsToSearch = [5];
                break;
            case 'engname':
                columnsToSearch = [6];
                break;
            case 'company':
                columnsToSearch = [7];
                break;
        }
        
        columnsToSearch.forEach(index => {
            if (cells[index] && cells[index].textContent.toLowerCase().includes(searchTerm)) {
                found = true;
            }
        });
        
        row.style.display = found ? '' : 'none';
    });
}

// เปลี่ยน Placeholder แบบไดนามิก
searchType.addEventListener('change', function() {
    const placeholders = {
        'all': 'ค้นหาทั้งหมด...',
        'code': 'ค้นหารหัส 10 หลัก...',
        'shortname': 'ค้นหาชื่อย่อสถานที่...',
        'thainame': 'ค้นหาชื่อสถานที่ (ไทย)...',
        'engname': 'ค้นหาชื่อสถานที่ (อังกฤษ)...',
        'company': 'ค้นหาชื่อบริษัท...'
    };
    
    searchInput.placeholder = placeholders[this.value];
    performSearch();
    searchInput.focus();
});

searchInput.addEventListener('input', performSearch);
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// ========================================
// ✅ แก้ไขใหม่ทั้งหมด: ปุ่ม Add Excel
// ========================================
const addExcelBtn = document.getElementById('addExcelBtn');
const excelFileInput = document.getElementById('excelFileInput');
const tableBody = document.querySelector('tbody');

// 📦 เก็บข้อมูลทั้งหมดไว้ใน memory
let fullDataStorage = [];

addExcelBtn.addEventListener('click', function() {
    excelFileInput.click();
});

excelFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            let dataRows = jsonData.slice(1);
            
            // กรองแถวว่างออก
            dataRows = dataRows.filter(row => {
                return row.some(cell => cell !== null && cell !== undefined && cell !== '');
            });
            
            console.log(`📊 Total rows after filtering: ${dataRows.length}`);
            
            fullDataStorage = dataRows;
            
            tableBody.innerHTML = '';
            
            dataRows.forEach((row, index) => {
                const tr = document.createElement('tr');
                tr.setAttribute('data-row-index', index);
                
                const tdCheckbox = document.createElement('td');
                tdCheckbox.innerHTML = '<input type="checkbox">';
                tr.appendChild(tdCheckbox);
                
                const tdNumber = document.createElement('td');
                tdNumber.textContent = row[0] || (index + 1);
                tr.appendChild(tdNumber);
                
                const tdCode = document.createElement('td');
                tdCode.textContent = row[1] || '-';
                tr.appendChild(tdCode);
                
                const tdRegion = document.createElement('td');
                tdRegion.textContent = row[3] || '-';
                tr.appendChild(tdRegion);
                
                const tdShortName = document.createElement('td');
                const shortName = row[4] || '-';
                const badgeColors = ['status-open', 'status-paid', 'status-due', 'status-inactive'];
                const randomColor = badgeColors[Math.floor(Math.random() * badgeColors.length)];
                tdShortName.innerHTML = `<span class="status-badge ${randomColor}">${shortName}</span>`;
                tr.appendChild(tdShortName);
                
                const tdThaiName = document.createElement('td');
                const thaiName = row[5] || '-';
                const thaiNameOld = row[6] || thaiName;
                tdThaiName.innerHTML = `${thaiName}<br><small style="color: #999;">${thaiNameOld}</small>`;
                tr.appendChild(tdThaiName);
                
                const tdEngName = document.createElement('td');
                const engName = row[7] || '-';
                const engNameOld = row[8] || engName;
                tdEngName.innerHTML = `${engName}<br><small style="color: #999;">${engNameOld}</small>`;
                tr.appendChild(tdEngName);
                
                const tdCompany = document.createElement('td');
                tdCompany.textContent = row[9] || '-';
                tr.appendChild(tdCompany);
                
                tr.style.cursor = 'pointer';
                tr.addEventListener('click', function(e) {
                    if (e.target.type === 'checkbox') return;
                    showDetailModal(index);
                });
                
                tableBody.appendChild(tr);
            });
            
            alert(`นำเข้าข้อมูลสำเร็จ! พบ ${dataRows.length} แถว\n\nกรุณาตรวจสอบข้อมูลในตาราง\nหากต้องการอัปโหลดให้คลิกปุ่ม "Upload to Firebase" ด้านล่าง`);
            
            const uploadBtn = document.getElementById('uploadFirebaseBtn');
            if (uploadBtn) {
                uploadBtn.classList.add('show');
            }
            
            excelFileInput.value = '';
            
        } catch (error) {
            console.error('Error reading Excel file:', error);
            alert('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel กรุณาตรวจสอบรูปแบบไฟล์');
        }
    };
    
    reader.readAsArrayBuffer(file);
});

// ========================================
// 📋 ฟังก์ชันแสดง Modal รายละเอียดเต็ม 37 คอลัมน์ + แผนที่
// ========================================
function showDetailModal(rowIndex) {
    const row = fullDataStorage[rowIndex];
    if (!row) return;
    
    // ดึงค่า Lat และ Long
    const lat = row[32];
    const long = row[33];
    
    console.log('🗺️ Map Debug:');
    console.log('Lat:', lat, 'Type:', typeof lat);
    console.log('Long:', long, 'Type:', typeof long);
    
    const latNum = parseFloat(lat);
    const longNum = parseFloat(long);
    
    console.log('Parsed Lat:', latNum, 'Valid:', !isNaN(latNum));
    console.log('Parsed Long:', longNum, 'Valid:', !isNaN(longNum));
    
    // ดึงรูปภาพ (ถ้ามี)
    const images = row[38] ? String(row[38]).split(',').map(url => url.trim()).filter(url => url) : [];
    console.log('📸 Images found:', images.length);
    console.log('📸 Images:', images);
    
    // เก็บ rowIndex ไว้ใช้ใน onclick
    window.currentRowIndex = rowIndex;
    
    // สร้างแผนที่
    let mapHTML = '';
    if (!isNaN(latNum) && !isNaN(longNum) && latNum !== 0 && longNum !== 0) {
        console.log('✅ Displaying map');
        mapHTML = `
            <div style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border: 2px solid #2196f3; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #1976d2;">📍 ตำแหน่งบนแผนที่</h4>
                <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                    <span style="background: white; padding: 8px 12px; border-radius: 5px; font-weight: bold;">
                        Lat: ${latNum}
                    </span>
                    <span style="background: white; padding: 8px 12px; border-radius: 5px; font-weight: bold;">
                        Long: ${longNum}
                    </span>
                    <a href="https://www.google.com/maps?q=${latNum},${longNum}" 
                       target="_blank" 
                       style="background: #2196f3; color: white; padding: 8px 15px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                        🗺️ เปิดใน Google Maps
                    </a>
                </div>
                <iframe 
                    width="100%" 
                    height="350" 
                    frameborder="0" 
                    style="border:0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" 
                    src="https://maps.google.com/maps?q=${latNum},${longNum}&z=15&output=embed"
                    allowfullscreen
                    loading="lazy">
                </iframe>
            </div>
        `;
    } else {
        console.log('❌ Map not displayed');
        mapHTML = `
            <div style="margin-bottom: 20px; padding: 15px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px;">
                <strong>⚠️ ไม่มีข้อมูลพิกัด (Lat/Long) หรือพิกัดไม่ถูกต้อง</strong>
                <br><small>Lat: ${lat || 'ไม่มี'}, Long: ${long || 'ไม่มี'}</small>
            </div>
        `;
    }
    
    // 📸 สร้างแกลเลอรี่รูปภาพ
    let galleryHTML = '';
    console.log('🎨 Creating gallery with', images.length, 'images');
    
    if (images.length > 0) {
        galleryHTML = `
            <div style="margin-bottom: 20px; padding: 15px; background: #fff; border: 2px solid #e0e0e0; border-radius: 8px;">
                <h4 style="margin: 0 0 15px 0; color: #333; display: flex; justify-content: space-between; align-items: center;">
                    📸 รูปภาพ (${images.length} รูป)
                    <button id="addImageBtn" style="
                        background: #4285f4;
                        color: white;
                        border: none;
                        padding: 8px 15px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                        ➕ เพิ่มรูป
                    </button>
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">
                    ${images.map((url, index) => `
                        <div style="position: relative; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <img src="${url}" 
                                 class="gallery-image"
                                 data-url="${url}"
                                 style="width: 100%; height: 150px; object-fit: cover; cursor: pointer; transition: transform 0.2s;"
                                 onmouseover="this.style.transform='scale(1.05)'"
                                 onmouseout="this.style.transform='scale(1)'">
                            <button class="delete-image-btn" data-index="${index}" style="
                                position: absolute;
                                top: 5px;
                                right: 5px;
                                background: rgba(231, 76, 60, 0.9);
                                color: white;
                                border: none;
                                width: 25px;
                                height: 25px;
                                border-radius: 50%;
                                cursor: pointer;
                                font-size: 14px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">×</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        galleryHTML = `
            <div style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border: 2px dashed #ccc; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #666;">📸 ยังไม่มีรูปภาพ</p>
                <button id="addImageBtn" style="
                    background: #4285f4;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                ">
                    ➕ อัปโหลดรูปแรก
                </button>
            </div>
        `;
    }
    
    // ตารางข้อมูล
    const columnMapping = [
        { name: 'ลำดับ', index: 0 },
        { name: 'รหัส10หลัก', index: 1 },
        { name: 'ภาคขายและบริการ', index: 3 },
        { name: 'ชื่อย่อสถานที่', index: 4 },
        { name: 'ชื่อสถานที่(ไทย)', index: 5 },
        { name: 'ชื่อสถานที่(ไทย)เดิม', index: 6 },
        { name: 'ชื่อสถานที่(อังกฤษ)', index: 7 },
        { name: 'ชื่อสถานที่(อังกฤษ)เดิม', index: 8 },
        { name: 'ชื่อบริษัท', index: 9 },
        { name: 'สถานะ', index: 10 },
        { name: 'Homing', index: 11 },
        { name: 'ศูนย์บริการลูกค้า', index: 12 },
        { name: 'Rank', index: 13 },
        { name: 'ขนาดเลขหมาย', index: 14 },
        { name: 'โครงการ', index: 15 },
        { name: 'รหัสสถานีฐานบริษัท', index: 16 },
        { name: 'SITE_NAMETH', index: 17 },
        { name: 'SITE_LAT', index: 18 },
        { name: 'SITE_LONG', index: 19 },
        { name: 'SITE_TYPE', index: 20 },
        { name: 'SITE_EQUIPMENT', index: 21 },
        { name: 'SITE_TYPE', index: 22 },
        { name: 'SITE OWNER', index: 23 },
        { name: 'สถานที่ติดตั้ง', index: 24 },
        { name: 'ซอย', index: 25 },
        { name: 'ถนน', index: 26 },
        { name: 'หมู่บ้าน', index: 27 },
        { name: 'แขวง/ตำบล', index: 28 },
        { name: 'เขต/อำเภอ', index: 29 },
        { name: 'จังหวัด', index: 30 },
        { name: 'รหัสไปรณีย์', index: 31 },
        { name: 'Lat', index: 32 },
        { name: 'Long', index: 33 },
        { name: 'ส่วนงานผู้ขอรหัส', index: 34 },
        { name: 'วันที่อนุมัติ', index: 35 },
        { name: 'ผู้จัดทำ', index: 36 },
        { name: 'หมายเหตุ', index: 37 }
    ];
    
    let detailHTML = '<div style="max-height: 50vh; overflow-y: auto;">';
    detailHTML += '<table style="width: 100%; border-collapse: collapse;">';
    
    columnMapping.forEach(col => {
        const value = row[col.index] || '-';
        detailHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; font-weight: bold; background: #f9f9f9; width: 40%;">${col.name}</td>
                <td style="padding: 10px;">${value}</td>
            </tr>
        `;
    });
    
    detailHTML += '</table></div>';
    
    // สร้าง Modal
    const modalHTML = `
        <div id="detailModal" style="
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
            padding: 20px;
        ">
            <div style="
                background: white;
                padding: 20px;
                border-radius: 10px;
                width: 90%;
                max-width: 900px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; position: sticky; top: 0; background: white; z-index: 100; padding-bottom: 10px; border-bottom: 2px solid #FFD101;">
                    <h3 style="margin: 0;">📋 รายละเอียดทั้งหมด 37 คอลัมน์</h3>
                    <button id="closeModal" style="
                        background: #e74c3c;
                        color: white;
                        border: none;
                        padding: 8px 15px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    ">✕ ปิด</button>
                </div>
                
                ${mapHTML}
                ${galleryHTML}
                ${detailHTML}
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modalContent = document.querySelector('#detailModal > div');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
    
    // เพิ่ม Event Listeners หลังจากสร้าง Modal แล้ว
    
    // ปุ่มปิด modal
    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('detailModal').remove();
    });
    
    // คลิกนอก Modal
    document.getElementById('detailModal').addEventListener('click', function(e) {
        if (e.target.id === 'detailModal') {
            this.remove();
        }
    });
    
    // ปุ่มเพิ่มรูป
    const addImageBtn = document.getElementById('addImageBtn');
    if (addImageBtn) {
        addImageBtn.addEventListener('click', function() {
            console.log('🔘 Add Image button clicked, rowIndex:', rowIndex);
            openCloudinaryWidget(rowIndex);
        });
    }
    
    // รูปภาพ - คลิกขยาย
    document.querySelectorAll('.gallery-image').forEach(img => {
        img.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            openImageModal(url);
        });
    });
    
    // ปุ่มลบรูป
    document.querySelectorAll('.delete-image-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const imageIndex = parseInt(this.getAttribute('data-index'));
            deleteImage(rowIndex, imageIndex);
        });
    });
}

// ========================================
// 📸 ฟังก์ชันเปิด Cloudinary Upload Widget
// ========================================
function openCloudinaryWidget(rowIndex) {
    console.log('📸 Opening Cloudinary Widget for rowIndex:', rowIndex);
    
    // ⚠️ ตรวจสอบว่าใส่ค่า Config แล้วหรือยัง
    if (CLOUDINARY_CONFIG.cloudName === 'YOUR_CLOUD_NAME_HERE' || 
        CLOUDINARY_CONFIG.uploadPreset === 'YOUR_UPLOAD_PRESET_HERE') {
        alert('⚠️ กรุณาแก้ไข CLOUDINARY_CONFIG ใน script.js ก่อน\n\ncloudName: ' + CLOUDINARY_CONFIG.cloudName + '\nuploadPreset: ' + CLOUDINARY_CONFIG.uploadPreset);
        console.error('❌ Cloudinary config not set');
        return;
    }
    
    // ตรวจสอบว่า cloudinary ถูก load แล้วหรือยัง
    if (typeof cloudinary === 'undefined') {
        alert('❌ Cloudinary library ยังไม่ถูกโหลด\nกรุณา Refresh หน้าเว็บ (F5)');
        console.error('❌ Cloudinary library not loaded');
        return;
    }
    
    console.log('✅ Creating widget with config:', {
        cloudName: CLOUDINARY_CONFIG.cloudName,
        uploadPreset: CLOUDINARY_CONFIG.uploadPreset
    });
    
    // สร้าง Upload Widget
    const widget = cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CONFIG.cloudName,
        uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
        folder: CLOUDINARY_CONFIG.folder,
        maxFiles: CLOUDINARY_CONFIG.maxFiles,
        multiple: true,
        sources: ['local', 'camera'],
        maxFileSize: 10000000, // 10MB
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        styles: {
            palette: {
                window: "#FFFFFF",
                windowBorder: "#90A0B3",
                tabIcon: "#FFD101",
                menuIcons: "#5A616A",
                textDark: "#000000",
                textLight: "#FFFFFF",
                link: "#4285f4",
                action: "#FFD101",
                inactiveTabIcon: "#0E2F5A",
                error: "#F44235",
                inProgress: "#0078FF",
                complete: "#20B832",
                sourceBg: "#E4EBF1"
            }
        }
    }, (error, result) => {
        if (error) {
            console.error('Upload error:', error);
            alert('❌ เกิดข้อผิดพลาดในการอัปโหลด: ' + error.message);
            return;
        }
        
        if (result && result.event === 'success') {
            console.log('✅ Uploaded:', result.info.secure_url);
            
            // แสดง loading
            const loadingDiv = document.createElement('div');
            loadingDiv.innerHTML = `
                <div style="position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10002; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                    ⏳ กำลังบันทึกรูปภาพ...
                </div>
            `;
            document.body.appendChild(loadingDiv);
            
            // บันทึก URL ลง Firestore
            saveImageToFirestore(rowIndex, result.info.secure_url).then(() => {
                loadingDiv.remove();
            }).catch(() => {
                loadingDiv.remove();
            });
        }
    });
    
    console.log('📤 Opening widget...');
    widget.open();
}

// ========================================
// 💾 บันทึกรูปลง Firestore
// ========================================
async function saveImageToFirestore(rowIndex, imageUrl) {
    try {
        const row = fullDataStorage[rowIndex];
        const code = row[1]; // รหัส 10 หลัก
        
        // หา document ที่ตรงกับรหัส 10 หลัก
        const snapshot = await db.collection('stations')
            .where('รหัส10หลัก', '==', code)
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            alert('❌ ไม่พบข้อมูลใน Firebase');
            return;
        }
        
        const doc = snapshot.docs[0];
        const currentImages = doc.data().images || [];
        
        // เพิ่ม URL ใหม่
        const updatedImages = [...currentImages, imageUrl];
        
        await doc.ref.update({
            images: updatedImages,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Image saved to Firestore');
        
        // อัปเดต fullDataStorage
        if (!fullDataStorage[rowIndex][38]) {
            fullDataStorage[rowIndex][38] = imageUrl;
        } else {
            fullDataStorage[rowIndex][38] += ',' + imageUrl;
        }
        
        // ปิด Modal เดิมและเปิดใหม่เพื่อแสดงรูป
        document.getElementById('detailModal').remove();
        showDetailModal(rowIndex);
        
    } catch (error) {
        console.error('Error saving image:', error);
        alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    }
}

// ========================================
// 🗑️ ลบรูป
// ========================================
async function deleteImage(rowIndex, imageIndex) {
    if (!confirm('ต้องการลบรูปนี้หรือไม่?')) return;
    
    try {
        const row = fullDataStorage[rowIndex];
        const code = row[1];
        
        const snapshot = await db.collection('stations')
            .where('รหัส10หลัก', '==', code)
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            alert('❌ ไม่พบข้อมูล');
            return;
        }
        
        const doc = snapshot.docs[0];
        const currentImages = doc.data().images || [];
        
        // ลบรูปออก
        currentImages.splice(imageIndex, 1);
        
        await doc.ref.update({
            images: currentImages,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Image deleted');
        
        // อัปเดต fullDataStorage
        fullDataStorage[rowIndex][38] = currentImages.join(',');
        
        // รีเฟรช Modal
        document.getElementById('detailModal').remove();
        showDetailModal(rowIndex);
        
    } catch (error) {
        console.error('Error deleting image:', error);
        alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    }
}

// ========================================
// 🖼️ เปิดรูปเต็มจอ (Lightbox)
// ========================================
function openImageModal(imageUrl) {
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
        " onclick="this.remove()">
            <img src="${imageUrl}" style="
                max-width: 90%;
                max-height: 90%;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            ">
            <button style="
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
            ">×</button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);
}

// ========================================
// 🔥 Upload to Firebase
// ========================================
async function uploadToFirestore(dataRows) {
    try {
        const filteredRows = dataRows.filter(row => {
            return row && row.length > 0 && row.some(cell => {
                return cell !== null && cell !== undefined && cell !== '' && cell !== ' ';
            });
        });
        
        console.log(`📊 Original: ${dataRows.length}, Filtered: ${filteredRows.length}`);
        
        if (filteredRows.length === 0) {
            alert('❌ ไม่พบข้อมูลที่จะอัปโหลด');
            return;
        }
        
        const loadingMsg = document.createElement('div');
        loadingMsg.id = 'uploadLoading';
        loadingMsg.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 20px; margin-bottom: 15px;">🔥 กำลังอัปโหลด...</div>
                    <div style="font-size: 16px; color: #666;"><span id="uploadProgress">0</span> / ${filteredRows.length} แถว</div>
                    <div style="margin-top: 15px;">
                        <div style="width: 300px; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden;">
                            <div id="uploadProgressBar" style="width: 0%; height: 100%; background: #FFD101; transition: width 0.3s;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(loadingMsg);

        const progressText = document.getElementById('uploadProgress');
        const progressBar = document.getElementById('uploadProgressBar');
        const collectionName = 'stations';
        
        let batch = db.batch();
        let batchCount = 0;
        let uploadedCount = 0;
        const BATCH_SIZE = 500;

        for (let i = 0; i < filteredRows.length; i++) {
            const row = filteredRows[i];
            
            const hasData = row.some(cell => cell !== null && cell !== undefined && cell !== '' && cell !== ' ');
            if (!hasData) continue;
            
            const docData = {
                ลำดับ: row[0] || null,
                รหัส10หลัก: row[1] || null,
                ภาคขายและบริการ: row[3] || null,
                ชื่อย่อสถานที่: row[4] || null,
                ชื่อสถานที่ไทย: row[5] || null,
                ชื่อสถานที่ไทยเดิม: row[6] || null,
                ชื่อสถานที่อังกฤษ: row[7] || null,
                ชื่อสถานที่อังกฤษเดิม: row[8] || null,
                ชื่อบริษัท: row[9] || null,
                สถานะ: row[10] || null,
                Homing: row[11] || null,
                ศูนย์บริการลูกค้า: row[12] || null,
                Rank: row[13] || null,
                ขนาดเลขหมาย: row[14] || null,
                โครงการ: row[15] || null,
                รหัสสถานีฐานบริษัท: row[16] || null,
                SITE_NAMETH: row[17] || null,
                SITE_LAT: row[18] || null,
                SITE_LONG: row[19] || null,
                SITE_TYPE: row[20] || null,
                SITE_EQUIPMENT: row[21] || null,
                SITE_TYPE2: row[22] || null,
                SITE_OWNER: row[23] || null,
                สถานที่ติดตั้ง: row[24] || null,
                ซอย: row[25] || null,
                ถนน: row[26] || null,
                หมู่บ้าน: row[27] || null,
                แขวงตำบล: row[28] || null,
                เขตอำเภอ: row[29] || null,
                จังหวัด: row[30] || null,
                รหัสไปรณีย์: row[31] || null,
                Lat: row[32] || null,
                Long: row[33] || null,
                ส่วนงานผู้ขอรหัส: row[34] || null,
                วันที่อนุมัติ: row[35] || null,
                ผู้จัดทำ: row[36] || null,
                หมายเหตุ: row[37] || null,
                // 📸 เพิ่มฟิลด์รูปภาพ (array ของ URL)
                images: row[38] ? String(row[38]).split(',').map(url => url.trim()).filter(url => url) : [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = db.collection(collectionName).doc();
            batch.set(docRef, docData);
            
            batchCount++;
            uploadedCount++;

            progressText.textContent = uploadedCount;
            progressBar.style.width = `${(uploadedCount / filteredRows.length) * 100}%`;

            if (batchCount === BATCH_SIZE || i === filteredRows.length - 1) {
                await batch.commit();
                console.log(`✅ Batch committed: ${batchCount} documents`);
                batch = db.batch();
                batchCount = 0;
            }
        }

        document.getElementById('uploadLoading').remove();
        alert(`✅ อัปโหลดสำเร็จ!\n\nอัปโหลด: ${uploadedCount} แถว\nCollection: ${collectionName}`);

    } catch (error) {
        console.error('Upload error:', error);
        const loadingElement = document.getElementById('uploadLoading');
        if (loadingElement) loadingElement.remove();
        alert(`❌ เกิดข้อผิดพลาด:\n${error.message}`);
    }
}

document.getElementById('uploadFirebaseBtn').addEventListener('click', function() {
    if (fullDataStorage.length === 0) {
        alert('❌ ไม่มีข้อมูล กรุณา Add Excel ก่อน');
        return;
    }
    uploadToFirestore(fullDataStorage);
});

// ===== Pagination =====
document.querySelectorAll('.pagination button').forEach(button => {
    button.addEventListener('click', function() {
        console.log('Pagination:', this.textContent);
    });
});

// ===== Resize =====
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        overlay.classList.remove('active');
        body.classList.remove('sidebar-open');
    } else {
        if (!sidebar.classList.contains('collapsed')) {
            sidebar.classList.add('collapsed');
            body.classList.add('sidebar-collapsed');
            const icon = toggleBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
});