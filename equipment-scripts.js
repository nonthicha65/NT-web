// =======================================================
// เนื้อหาทั้งหมดในไฟล์ equipment-scripts.js
// =======================================================

// ===== 1. Utility: Read URL Query Parameters =====

// Mapping เพื่อใช้ในการแสดงผล UI
const STATION_MAP = {
    'maeta': 'แม่ทา',
    'khaohuaikaew': 'เขาห้วยแก้ว',
    'umong': 'อุโมงค์',
    'lamphun1': 'ชส.ลำพูน1'
};

const TYPE_MAP = {
    'air': 'Air Conditioner',
    'battery': 'Battery',
    'generator': 'Generator',
    'transformer': 'Transformer',
    'rectifier': 'Rectifier'
};

function getQueryParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const regex = /([^&=]+)=([^&]*)/g;
    let m;
    while (m = regex.exec(queryString)) {
        params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }
    return params;
}

function loadPageContent() {
    const params = getQueryParams();
    const stationKey = params.station || 'maeta'; // Default to maeta
    const typeKey = params.type || 'air';      // Default to air
    
    const stationName = STATION_MAP[stationKey] || stationKey;
    const typeName = TYPE_MAP[typeKey] || typeKey;
    
    // 1. Update UI Elements (Breadcrumb, Title)
    const breadcrumbElement = document.querySelector('.breadcrumb');
    if (breadcrumbElement) breadcrumbElement.textContent = `${stationName} - ${typeName}`;
    
    const titleElement = document.querySelector('#inventoryTitle');
    if (titleElement) titleElement.textContent = typeName;
    
    document.title = `${typeName} - ${stationName}`;
    
    // 2. Load Data (Future: Firebase)
    console.log(`✅ Loading data for Station: ${stationName} (${stationKey}) and Type: ${typeName} (${typeKey})...`);
    
    // For now, load simulated data based on type
    loadSimulatedData(typeKey); 
}


// ===== 2. Data Logic (Simulated Data) =====
// ข้อมูลจำลองที่ถูกสร้างจาก Type และ Station (ในอนาคตจะดึงจาก Firebase)
const SIMULATED_DATA = {
    air: [
        { serial: '44SK7002647', newCode: '103011024012', oldCode: '11491162', capDate: '6/3/2005', centerCode: 'C001900', images: [{name: 'AC_Unit_1.jpg', date: '13/05/2022', url: 'img/ac1.jpg'}, {name: 'AC_Side_view.jpg', date: '13/05/2022', url: 'img/ac2.jpg'}] },
        { serial: '1905AF26407', newCode: '103011024012', oldCode: '11491162', capDate: '6/3/2005', centerCode: 'C001900', images: [{name: 'AC_2_front.jpg', date: '15/05/2022', url: 'img/ac3.jpg'}] },
        { serial: '44LF7167805', newCode: '103013014047', oldCode: '14197690', capDate: '5/7/2021', centerCode: 'C001900', images: [] },
        // ... (เพิ่มข้อมูลจำลองอื่น ๆ ที่นี่)
    ],
    battery: [
        { serial: 'BATT-2023-A01', newCode: '20202020', oldCode: '90000', capDate: '1/1/2023', centerCode: 'C001900', images: [{name: 'Battery_1.jpg', date: '01/01/2023', url: 'img/batt1.jpg'}] },
        { serial: 'BATT-2023-A02', newCode: '20202020', oldCode: '90001', capDate: '1/1/2023', centerCode: 'C001900', images: [] },
    ],
    // ... อื่น ๆ
};

let currentEquipmentData = [];

function loadSimulatedData(type) {
    const data = SIMULATED_DATA[type] || [];
    currentEquipmentData = data;
    renderTable(data);
}

function renderTable(data) {
    const tableBody = document.getElementById('eqTableBody');
    if (!tableBody) return;
    
    let html = '';
    data.forEach((unit, index) => {
        html += `
            <tr data-serial="${unit.serial}">
                <td>${index + 1}</td>
                <td>${unit.newCode}</td>
                <td>${unit.oldCode}</td>
                <td>${unit.serial}</td>
                <td>${unit.capDate}</td>
                <td>${unit.centerCode}</td>
                <td>
                    <button class="action-btn edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    tableBody.innerHTML = html;
    initTableListeners();
}


// ===== 3. ตาราง - คลิกเพื่อแสดงรูปภาพ และ Logic อื่นๆ =====
const viewerContainer = document.getElementById('currentUnitViewer');
const metadataContainer = document.getElementById('metadataGalleryContainer');
const galleryTitle = document.getElementById('galleryTitle');

function showUnitImages(serial) {
    const unit = currentEquipmentData.find(u => u.serial === serial);
    if (!unit) return;
    
    galleryTitle.textContent = `รูปภาพที่เกี่ยวข้อง (Serial: ${serial})`;
    
    if (!unit.images || unit.images.length === 0) {
        viewerContainer.innerHTML = `<div class="viewer-placeholder">No images found for this unit.</div>`;
        metadataContainer.innerHTML = 'ไม่มีรายการ';
        return;
    }
    
    const firstImageUrl = unit.images[0].url;
    
    // A. Viewer (รูปใหญ่) - แสดงรูปแรก
    viewerContainer.innerHTML = `<img src="${firstImageUrl}" alt="Current Unit Image">`;
    viewerContainer.onclick = () => openImageLightbox(firstImageUrl); // ผูก lightbox กับรูปใหญ่
    
    // B. Metadata List (รายการรูปย่อ)
    const metadataHTML = unit.images.map(image => `
        <div class="gallery-metadata-item" 
             data-url="${image.url}" 
             onclick="changeViewerImage('${image.url}')"
             style="cursor: pointer;">
            <div>${image.name}</div>
            <small>${image.date}</small>
            <button class="delete-icon"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
    
    metadataContainer.innerHTML = metadataHTML;
}

// ฟังก์ชันเปลี่ยนรูปใน Viewer (เมื่อคลิกรายการซ้ายมือ)
function changeViewerImage(imageUrl) {
    const viewerImg = viewerContainer.querySelector('img');
    if (viewerImg) {
        viewerImg.src = imageUrl;
        viewerContainer.onclick = () => openImageLightbox(imageUrl); // ผูก lightbox ใหม่
    }
}


function initTableListeners() {
    const tableBody = document.getElementById('eqTableBody');
    if (!tableBody) return;
    
    tableBody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', function(e) {
            if (e.target.closest('.action-btn')) return;
            
            tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
            this.classList.add('selected');
            
            const serial = this.getAttribute('data-serial');
            showUnitImages(serial);
        });
    });
    
    // แสดงรูปภาพของแถวแรกเมื่อโหลดหน้า
    const firstRow = tableBody.querySelector('tr');
    if (firstRow) {
        firstRow.classList.add('selected');
        showUnitImages(firstRow.getAttribute('data-serial'));
    }
}


// ===== 4. ฟังก์ชันเปิดรูปภาพเต็มจอ (Lightbox - คัดลอกมา) =====
function openImageLightbox(imageUrl) {
    if (!imageUrl || imageUrl.includes('via.placeholder.com') || !imageUrl.includes('img/')) { 
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
                pointer-events: none;
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

    const lightbox = document.getElementById('imageLightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target.id === 'imageLightbox' || e.target.id === 'closeLightboxBtn' || e.target.closest('#closeLightboxBtn')) {
                 this.remove();
            }
        });
    }
}


// ===== 5. Logic การค้นหา (Search) =====
const searchInput = document.getElementById('eqSearchInput');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const tableBody = document.getElementById('eqTableBody');
        if (!tableBody) return;

        tableBody.querySelectorAll('tr').forEach(row => {
            const rowText = row.textContent.toLowerCase();
            if (rowText.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}


// ===== 6. Toggle Sidebar Logic (คัดลอกมา) =====
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


// ===== 7. โค้ดที่ทำงานเมื่อโหลดหน้าเว็บ =====
window.addEventListener('DOMContentLoaded', () => {
    loadPageContent(); 
});