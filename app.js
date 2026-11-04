// คีย์สำหรับเก็บข้อมูลใน LocalStorage
const STORAGE_KEY_PEOPLE = 'webapp_people_list_v2';
const STORAGE_KEY_POSITIONS = 'webapp_positions_list_v2';

// ป้ายชื่อหมวดหมู่ภาษาไทย
const LIST_TYPE_LABELS = {
    executive: '2.1 รายชื่อบริหาร',
    actual: '2.2 รายชื่อทำงานจริง'
};

const SUB_GROUP_LABELS = {
    directorate: 'กองอำนวยการ',
    participant: 'ผู้เข้าร่วมสัมมนา'
};

// ข้อมูลเริ่มต้น (กรณีเปิดใช้งานครั้งแรก)
const DEFAULT_POSITIONS = [
    { id: 'pos-1', name: 'ประธานโครงการ', color: 'primary' },
    { id: 'pos-2', name: 'หัวหน้ากองอำนวยการ', color: 'danger' },
    { id: 'pos-3', name: 'วิทยากรหลัก', color: 'success' },
    { id: 'pos-4', name: 'ฝ่ายประสานงาน', color: 'info' },
    { id: 'pos-5', name: 'ฝ่ายทะเบียนและต้อนรับ', color: 'warning' },
    { id: 'pos-6', name: 'ฝ่ายโสตทัศนูปกรณ์ / IT', color: 'dark' }
];

const DEFAULT_PEOPLE = [
    // 2.1 รายชื่อบริหาร - กองอำนวยการ
    {
        id: 'emp-1',
        firstName: 'สมชาย',
        lastName: 'สายบริหาร',
        listType: 'executive',
        subGroup: 'directorate',
        positionIds: ['pos-1', 'pos-2']
    },
    // 2.1 รายชื่อบริหาร - ผู้เข้าร่วมสัมมนา
    {
        id: 'emp-2',
        firstName: 'วิภาวี',
        lastName: 'วิชาการเด่น',
        listType: 'executive',
        subGroup: 'participant',
        positionIds: ['pos-3']
    },
    // 2.2 รายชื่อทำงานจริง - กองอำนวยการ (ดึงจากสมชาย + เพิ่มตำแหน่งทำงานจริง)
    {
        id: 'emp-3',
        firstName: 'สมชาย',
        lastName: 'สายบริหาร',
        listType: 'actual',
        subGroup: 'directorate',
        positionIds: ['pos-1', 'pos-2', 'pos-4']
    },
    // 2.2 รายชื่อทำงานจริง - ผู้เข้าร่วมสัมมนา
    {
        id: 'emp-4',
        firstName: 'กิตติพงศ์',
        lastName: 'คล่องแคล่ว',
        listType: 'actual',
        subGroup: 'participant',
        positionIds: ['pos-5', 'pos-6']
    }
];

// State ของแอปพลิเคชัน
let positions = [];
let people = [];
let activeFilterListType = 'all'; // 'all' | 'executive' | 'actual'
let activeFilterSubGroup = 'all'; // 'all' | 'directorate' | 'participant'
let matchedExecPersonForForm = null;

// อ้างอิง DOM Elements
const personForm = document.getElementById('personForm');
const listTypeSelect = document.getElementById('listType');
const subGroupSelect = document.getElementById('subGroup');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const execFirstNamesList = document.getElementById('execFirstNamesList');

const pullFromExecBox = document.getElementById('pullFromExecBox');
const selectExecPerson = document.getElementById('selectExecPerson');
const btnCopyAllExecToActual = document.getElementById('btnCopyAllExecToActual');
const autoMatchedExecNotice = document.getElementById('autoMatchedExecNotice');
const autoMatchedExecText = document.getElementById('autoMatchedExecText');
const copyPositionsSwitch = document.getElementById('copyPositionsSwitch');

const positionForm = document.getElementById('positionForm');
const positionNameInput = document.getElementById('positionName');
const positionColorSelect = document.getElementById('positionColor');

const positionsPool = document.getElementById('positionsPool');
const peopleSectionsWrapper = document.getElementById('peopleSectionsWrapper');
const summaryTableBody = document.getElementById('summaryTableBody');

const positionCountBadge = document.getElementById('positionCountBadge');
const personCountBadge = document.getElementById('personCountBadge');
const searchPersonInput = document.getElementById('searchPersonInput');

const countAllTab = document.getElementById('countAllTab');
const countExecTab = document.getElementById('countExecTab');
const countActualTab = document.getElementById('countActualTab');

const btnLoadSample = document.getElementById('btnLoadSample');
const btnResetAll = document.getElementById('btnResetAll');

const btnExportAllCsv = document.getElementById('btnExportAllCsv');
const btnExportExecCsv = document.getElementById('btnExportExecCsv');
const btnExportActualCsv = document.getElementById('btnExportActualCsv');
const btnExportTableCsv = document.getElementById('btnExportTableCsv');

const assignPositionModalEl = document.getElementById('assignPositionModal');
const assignPositionModal = new bootstrap.Modal(assignPositionModalEl);
const modalPersonName = document.getElementById('modalPersonName');
const modalPositionsList = document.getElementById('modalPositionsList');

const toastEl = document.getElementById('appToast');
const appToast = new bootstrap.Toast(toastEl, { delay: 2500 });
const toastMessage = document.getElementById('toastMessage');

// เริ่มต้นทำงานเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    setupFiltersAndAutoFill();
    renderAll();
});

// โหลดข้อมูลจาก LocalStorage
function loadFromStorage() {
    const savedPositions = localStorage.getItem(STORAGE_KEY_POSITIONS);
    const savedPeople = localStorage.getItem(STORAGE_KEY_PEOPLE);

    if (savedPositions && savedPeople) {
        positions = JSON.parse(savedPositions);
        people = JSON.parse(savedPeople);
    } else {
        positions = [...DEFAULT_POSITIONS];
        people = JSON.parse(JSON.stringify(DEFAULT_PEOPLE));
        saveToStorage();
    }
}

// บันทึกข้อมูลลง LocalStorage
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY_POSITIONS, JSON.stringify(positions));
    localStorage.setItem(STORAGE_KEY_PEOPLE, JSON.stringify(people));
}

function showNotification(message) {
    toastMessage.textContent = message;
    appToast.show();
}

// ตั้งค่าการสลับหมวดหมู่และระบบดึงข้อมูลอัตโนมัติจาก 2.1 มาใส่ 2.2
function setupFiltersAndAutoFill() {
    // เมื่อเปลี่ยนหมวดรายชื่อในฟอร์ม (2.1 บริหาร <-> 2.2 ทำงานจริง)
    listTypeSelect.addEventListener('change', () => {
        const isActual = listTypeSelect.value === 'actual';
        pullFromExecBox.classList.toggle('d-none', !isActual);
        checkExecNameMatch();
    });

    // เมื่อเลือกรายชื่อจาก Dropdown ของ 2.1 รายชื่อบริหาร เพื่อดึงมาใส่ฟอร์ม 2.2
    selectExecPerson.addEventListener('change', () => {
        const execId = selectExecPerson.value;
        if (!execId) return;

        const execPerson = people.find((p) => p.id === execId && p.listType === 'executive');
        if (execPerson) {
            firstNameInput.value = execPerson.firstName;
            lastNameInput.value = execPerson.lastName;
            subGroupSelect.value = execPerson.subGroup;
            checkExecNameMatch();
            showNotification(`ดึงข้อมูลคุณ "${execPerson.firstName} ${execPerson.lastName}" มาใส่ฟอร์มแล้ว`);
        }
    });

    // เมื่อพิมพ์ชื่อหรือนามสกุลในหมวด 2.2 ให้ตรวจสอบว่าตรงกับ 2.1 รายชื่อบริหารหรือไม่
    firstNameInput.addEventListener('input', () => {
        if (listTypeSelect.value === 'actual') {
            const typedFirst = firstNameInput.value.trim().toLowerCase();
            // ถ้านามสกุลยังว่าง และมีชื่อตรงกับ 2.1 เพียงคนเดียว ให้เติมเต็มนามสกุลและกลุ่มให้อัตโนมัติ
            const matches = people.filter(
                (p) => p.listType === 'executive' && p.firstName.toLowerCase() === typedFirst
            );
            if (matches.length === 1 && !lastNameInput.value.trim()) {
                lastNameInput.value = matches[0].lastName;
                subGroupSelect.value = matches[0].subGroup;
            }
            checkExecNameMatch();
        }
    });

    lastNameInput.addEventListener('input', () => {
        if (listTypeSelect.value === 'actual') {
            checkExecNameMatch();
        }
    });

    // ปุ่มดึงรายชื่อบริหาร (2.1) ทั้งหมดมาใส่ในรายชื่อทำงานจริง (2.2)
    btnCopyAllExecToActual.addEventListener('click', () => {
        const execList = people.filter((p) => p.listType === 'executive');
        if (execList.length === 0) {
            showNotification('ยังไม่มีข้อมูลใน 2.1 รายชื่อบริหาร');
            return;
        }

        let addedCount = 0;
        execList.forEach((execPerson) => {
            const existingActual = people.find(
                (p) =>
                    p.listType === 'actual' &&
                    p.firstName.toLowerCase() === execPerson.firstName.toLowerCase() &&
                    p.lastName.toLowerCase() === execPerson.lastName.toLowerCase()
            );

            if (!existingActual) {
                people.push({
                    id: 'emp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                    firstName: execPerson.firstName,
                    lastName: execPerson.lastName,
                    listType: 'actual',
                    subGroup: execPerson.subGroup,
                    positionIds: [...execPerson.positionIds]
                });
                addedCount++;
            } else {
                // หากมีชื่ออยู่แล้ว ให้ผสานตำแหน่งจาก 2.1 เข้าไปให้ครบ
                execPerson.positionIds.forEach((posId) => {
                    if (!existingActual.positionIds.includes(posId)) {
                        existingActual.positionIds.push(posId);
                    }
                });
            }
        });

        saveToStorage();
        renderAll();
        showNotification(`ดึงข้อมูลจากรายชื่อบริหารมาใส่รายชื่อทำงานจริงเรียบร้อย (${addedCount} รายชื่อใหม่)`);
    });

    // แท็บกรองหมวดหมู่หลัก (ทั้งหมด / 2.1 บริหาร / 2.2 ทำงานจริง)
    document.querySelectorAll('#listTypeFilterTabs button').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#listTypeFilterTabs button').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilterListType = btn.dataset.filterType;
            renderPeople();
        });
    });

    // ปุ่มกรองกลุ่มย่อย (ทุกกลุ่ม / กองอำนวยการ / ผู้เข้าร่วมสัมมนา)
    document.querySelectorAll('[data-filter-subgroup]').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-filter-subgroup]').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilterSubGroup = btn.dataset.filterSubgroup;
            renderPeople();
        });
    });

    // ปุ่ม Export CSV
    btnExportAllCsv.addEventListener('click', () => exportToCsv('all'));
    btnExportExecCsv.addEventListener('click', () => exportToCsv('executive'));
    btnExportActualCsv.addEventListener('click', () => exportToCsv('actual'));
    btnExportTableCsv.addEventListener('click', () => exportToCsv('all'));
}

// ตรวจสอบว่าชื่อที่กำลังกรอกในหมวด 2.2 ตรงกับรายชื่อใน 2.1 หรือไม่
function checkExecNameMatch() {
    if (listTypeSelect.value !== 'actual') {
        autoMatchedExecNotice.classList.add('d-none');
        matchedExecPersonForForm = null;
        return;
    }

    const fName = firstNameInput.value.trim().toLowerCase();
    const lName = lastNameInput.value.trim().toLowerCase();

    if (!fName) {
        autoMatchedExecNotice.classList.add('d-none');
        matchedExecPersonForForm = null;
        return;
    }

    const match = people.find(
        (p) =>
            p.listType === 'executive' &&
            p.firstName.toLowerCase() === fName &&
            (!lName || p.lastName.toLowerCase() === lName)
    );

    if (match) {
        matchedExecPersonForForm = match;
        const posNames = match.positionIds
            .map((id) => positions.find((pos) => pos.id === id)?.name)
            .filter(Boolean);
        autoMatchedExecText.textContent = `พบชื่อตรงกับ 2.1 รายชื่อบริหาร (${SUB_GROUP_LABELS[match.subGroup]}) ${
            posNames.length > 0 ? '— ตำแหน่ง: ' + posNames.join(', ') : ''
        }`;
        autoMatchedExecNotice.classList.remove('d-none');
    } else {
        matchedExecPersonForForm = null;
        autoMatchedExecNotice.classList.add('d-none');
    }
}

// อัปเดตตัวเลือกใน Dropdown & Datalist ของรายชื่อบริหาร (2.1)
function updateExecQuickSelectOptions() {
    const execPeople = people.filter((p) => p.listType === 'executive');

    selectExecPerson.innerHTML =
        '<option value="">-- เลือกรายชื่อจาก 2.1 รายชื่อบริหาร เพื่อดึงข้อมูลมาใส่ทันที --</option>';
    execFirstNamesList.innerHTML = '';

    execPeople.forEach((p) => {
        const posNames = p.positionIds
            .map((id) => positions.find((pos) => pos.id === id)?.name)
            .filter(Boolean)
            .join(', ');

        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.firstName} ${p.lastName} [${SUB_GROUP_LABELS[p.subGroup]}] ${
            posNames ? '(' + posNames + ')' : ''
        }`;
        selectExecPerson.appendChild(opt);

        const dataOpt = document.createElement('option');
        dataOpt.value = p.firstName;
        dataOpt.label = `${p.firstName} ${p.lastName} (2.1 รายชื่อบริหาร)`;
        execFirstNamesList.appendChild(dataOpt);
    });
}

// 1. ฟอร์มเพิ่มรายชื่อคน
personForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const listType = listTypeSelect.value;
    const subGroup = subGroupSelect.value;

    if (!firstName || !lastName) return;

    // ตรวจสอบว่าหากเป็น 2.2 รายชื่อทำงานจริง และมีชื่อตรงกับ 2.1 รายชื่อบริหาร ให้ดึงตำแหน่งมาด้วยตามตั้งค่า
    let initialPositions = [];
    if (listType === 'actual' && matchedExecPersonForForm && copyPositionsSwitch.checked) {
        initialPositions = [...matchedExecPersonForForm.positionIds];
    }

    const newPerson = {
        id: 'emp-' + Date.now(),
        firstName,
        lastName,
        listType,
        subGroup,
        positionIds: initialPositions
    };

    people.unshift(newPerson);
    saveToStorage();
    renderAll();

    firstNameInput.value = '';
    lastNameInput.value = '';
    selectExecPerson.value = '';
    checkExecNameMatch();
    firstNameInput.focus();

    showNotification(
        `เพิ่ม "${firstName} ${lastName}" ลงใน ${LIST_TYPE_LABELS[listType]} (${SUB_GROUP_LABELS[subGroup]}) แล้ว`
    );
});

// คัดลอกรายชื่อคนเดียวจาก 2.1 รายชื่อบริหาร ไปยัง 2.2 รายชื่อทำงานจริง
function copySingleExecToActual(execPersonId) {
    const execPerson = people.find((p) => p.id === execPersonId && p.listType === 'executive');
    if (!execPerson) return;

    const existingActual = people.find(
        (p) =>
            p.listType === 'actual' &&
            p.firstName.toLowerCase() === execPerson.firstName.toLowerCase() &&
            p.lastName.toLowerCase() === execPerson.lastName.toLowerCase()
    );

    if (existingActual) {
        // อัปเดตตำแหน่งและกลุ่มให้ตรงกัน
        existingActual.subGroup = execPerson.subGroup;
        execPerson.positionIds.forEach((posId) => {
            if (!existingActual.positionIds.includes(posId)) {
                existingActual.positionIds.push(posId);
            }
        });
        saveToStorage();
        renderAll();
        showNotification(`อัปเดตข้อมูล "${execPerson.firstName}" ใน 2.2 รายชื่อทำงานจริงเรียบร้อย`);
        return;
    }

    const clonedPerson = {
        id: 'emp-' + Date.now(),
        firstName: execPerson.firstName,
        lastName: execPerson.lastName,
        listType: 'actual',
        subGroup: execPerson.subGroup,
        positionIds: [...execPerson.positionIds]
    };

    people.unshift(clonedPerson);
    saveToStorage();
    renderAll();
    showNotification(`ดึง "${execPerson.firstName} ${execPerson.lastName}" ไปใส่ 2.2 รายชื่อทำงานจริงแล้ว`);
}

// 2. ฟอร์มเพิ่มตำแหน่ง
positionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = positionNameInput.value.trim();
    const color = positionColorSelect.value;

    if (!name) return;

    const exists = positions.some((p) => p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        showNotification(`มีตำแหน่ง "${name}" อยู่ในระบบแล้ว`);
        return;
    }

    const newPos = {
        id: 'pos-' + Date.now(),
        name,
        color
    };

    positions.push(newPos);
    saveToStorage();
    renderAll();

    positionNameInput.value = '';
    positionNameInput.focus();
    showNotification(`เพิ่มตำแหน่ง "${name}" เรียบร้อยแล้ว`);
});

// 3. การจับคู่ตำแหน่งให้คน (1 คนมีได้หลายตำแหน่ง)
function assignPositionToPerson(personId, positionId) {
    const person = people.find((p) => p.id === personId);
    const position = positions.find((pos) => pos.id === positionId);

    if (!person || !position) return;

    if (person.positionIds.includes(positionId)) {
        showNotification(`${person.firstName} มีตำแหน่ง "${position.name}" อยู่แล้ว`);
        return;
    }

    person.positionIds.push(positionId);
    saveToStorage();
    renderAll();
    showNotification(`เพิ่มตำแหน่ง "${position.name}" ให้คุณ ${person.firstName} แล้ว`);
}

// ลบตำแหน่งออกจากคน
function removePositionFromPerson(personId, positionId) {
    const person = people.find((p) => p.id === personId);
    if (!person) return;

    person.positionIds = person.positionIds.filter((id) => id !== positionId);
    saveToStorage();
    renderAll();
}

// เปลี่ยนกลุ่มย่อย (กองอำนวยการ <-> ผู้เข้าร่วมสัมมนา) บนการ์ดคนได้โดยตรง
function togglePersonSubGroup(personId, newSubGroup) {
    const person = people.find((p) => p.id === personId);
    if (!person) return;

    person.subGroup = newSubGroup;
    saveToStorage();
    renderAll();
    showNotification(`ย้ายคุณ ${person.firstName} ไปยังกลุ่ม "${SUB_GROUP_LABELS[newSubGroup]}" แล้ว`);
}

// ลบรายชื่อคน
function deletePerson(personId) {
    const person = people.find((p) => p.id === personId);
    if (!person) return;

    people = people.filter((p) => p.id !== personId);
    saveToStorage();
    renderAll();
    showNotification(`ลบรายชื่อ "${person.firstName} ${person.lastName}" แล้ว`);
}

// ลบตำแหน่งออกจากระบบทั้งหมด
function deletePosition(positionId) {
    const pos = positions.find((p) => p.id === positionId);
    if (!pos) return;

    positions = positions.filter((p) => p.id !== positionId);
    people.forEach((person) => {
        person.positionIds = person.positionIds.filter((id) => id !== positionId);
    });

    saveToStorage();
    renderAll();
    showNotification(`ลบตำแหน่ง "${pos.name}" ออกจากระบบแล้ว`);
}

// เปิด Modal เพื่อเลือกติ๊กตำแหน่งให้คน
function openAssignModal(personId) {
    const person = people.find((p) => p.id === personId);
    if (!person) return;

    modalPersonName.textContent = `${person.firstName} ${person.lastName} (${LIST_TYPE_LABELS[person.listType]})`;
    renderModalPositions(person);
    assignPositionModal.show();
}

function renderModalPositions(person) {
    modalPositionsList.innerHTML = '';

    if (positions.length === 0) {
        modalPositionsList.innerHTML = `
            <div class="text-center text-muted py-3">
                ยังไม่มีตำแหน่งในระบบ กรุณาเพิ่มตำแหน่งก่อนครับ
            </div>
        `;
        return;
    }

    positions.forEach((pos) => {
        const isAssigned = person.positionIds.includes(pos.id);
        const item = document.createElement('label');
        item.className = `list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 rounded border ${
            isAssigned ? 'border-primary bg-primary-subtle' : ''
        }`;
        item.style.cursor = 'pointer';

        item.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <input class="form-check-input m-0 fs-5" type="checkbox" ${isAssigned ? 'checked' : ''}>
                <span class="badge text-bg-${pos.color} rounded-pill px-3 py-2">${escapeHtml(pos.name)}</span>
            </div>
            <span class="small ${isAssigned ? 'text-primary fw-semibold' : 'text-muted'}">
                ${isAssigned ? '<i class="bi bi-check-circle-fill me-1"></i>เลือกแล้ว' : 'คลิกเพื่อเลือก'}
            </span>
        `;

        const checkbox = item.querySelector('input');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                if (!person.positionIds.includes(pos.id)) {
                    person.positionIds.push(pos.id);
                }
            } else {
                person.positionIds = person.positionIds.filter((id) => id !== pos.id);
            }
            saveToStorage();
            renderAll();
            renderModalPositions(person);
        });

        modalPositionsList.appendChild(item);
    });
}

// ค้นหากรองรายชื่อ
searchPersonInput.addEventListener('input', () => {
    renderPeople();
});

// ปุ่มโหลดข้อมูลตัวอย่าง
btnLoadSample.addEventListener('click', () => {
    positions = [...DEFAULT_POSITIONS];
    people = JSON.parse(JSON.stringify(DEFAULT_PEOPLE));
    saveToStorage();
    renderAll();
    showNotification('โหลดข้อมูลตัวอย่างเรียบร้อยแล้ว');
});

// ปุ่มล้างข้อมูลทั้งหมด
btnResetAll.addEventListener('click', () => {
    if (confirm('ต้องการล้างรายชื่อและตำแหน่งทั้งหมดใช่หรือไม่?')) {
        positions = [];
        people = [];
        saveToStorage();
        renderAll();
        showNotification('ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว');
    }
});

// ฟังก์ชัน Export ข้อมูลออกเป็นไฟล์ CSV (รองรับภาษาไทยใน Excel ด้วย UTF-8 BOM)
function exportToCsv(filterType = 'all') {
    let targetPeople = people;
    let filePrefix = 'รายงานสรุปทั้งหมด_บริหารและทำงานจริง';

    if (filterType === 'executive') {
        targetPeople = people.filter((p) => p.listType === 'executive');
        filePrefix = 'รายงาน_2.1_รายชื่อบริหาร';
    } else if (filterType === 'actual') {
        targetPeople = people.filter((p) => p.listType === 'actual');
        filePrefix = 'รายงาน_2.2_รายชื่อทำงานจริง';
    }

    if (targetPeople.length === 0) {
        showNotification('ไม่มีข้อมูลรายชื่อสำหรับออกรายงาน CSV');
        return;
    }

    const headers = [
        'ลำดับ',
        'หมวดรายชื่อ',
        'กลุ่มย่อย (กองอำนวยการ/ผู้เข้าร่วมสัมมนา)',
        'ชื่อ',
        'นามสกุล',
        'ชื่อ-นามสกุล',
        'ตำแหน่งทั้งหมดที่ได้รับ',
        'จำนวนตำแหน่ง'
    ];

    const rows = targetPeople.map((person, index) => {
        const posNames = person.positionIds
            .map((id) => positions.find((p) => p.id === id)?.name)
            .filter(Boolean)
            .join(' | ');

        return [
            index + 1,
            LIST_TYPE_LABELS[person.listType] || person.listType,
            SUB_GROUP_LABELS[person.subGroup] || person.subGroup,
            person.firstName,
            person.lastName,
            `${person.firstName} ${person.lastName}`,
            posNames || 'ยังไม่ได้ระบุตำแหน่ง',
            person.positionIds.length
        ];
    });

    const csvContent =
        '\uFEFF' +
        [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification(`ดาวน์โหลดไฟล์ ${filePrefix}.csv เรียบร้อยแล้ว`);
}

// ฟังก์ชัน Render หน้าจอทั้งหมด
function renderAll() {
    updateExecQuickSelectOptions();
    renderPositionsPool();
    renderPeople();
    renderSummaryTable();
}

// Render คลังตำแหน่ง (สามารถลาก Drag ได้)
function renderPositionsPool() {
    positionsPool.innerHTML = '';
    positionCountBadge.textContent = `${positions.length} ตำแหน่ง`;

    if (positions.length === 0) {
        positionsPool.innerHTML = `
            <div class="w-100 text-center text-muted my-auto py-4">
                <i class="bi bi-inbox fs-2 d-block mb-1"></i>
                ยังไม่มีตำแหน่งงาน กรุณาเพิ่มตำแหน่งด้านบน
            </div>
        `;
        return;
    }

    positions.forEach((pos) => {
        const badge = document.createElement('div');
        badge.className = `position-chip text-bg-${pos.color} shadow-sm`;
        badge.setAttribute('draggable', 'true');
        badge.dataset.positionId = pos.id;

        badge.innerHTML = `
            <i class="bi bi-grip-vertical opacity-75"></i>
            <span>${escapeHtml(pos.name)}</span>
            <button type="button" class="chip-remove-btn ms-1" title="ลบตำแหน่งนี้ออกจากระบบ">
                <i class="bi bi-x"></i>
            </button>
        `;

        badge.addEventListener('dragstart', (e) => {
            badge.classList.add('dragging');
            e.dataTransfer.setData('text/plain', pos.id);
            e.dataTransfer.effectAllowed = 'copy';
        });

        badge.addEventListener('dragend', () => {
            badge.classList.remove('dragging');
        });

        const removeBtn = badge.querySelector('.chip-remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deletePosition(pos.id);
        });

        positionsPool.appendChild(badge);
    });
}

// Render การ์ดรายชื่อคน แยกตามหมวดหมู่ (2.1 รายชื่อบริหาร & 2.2 รายชื่อทำงานจริง) และกลุ่มย่อย (กองอำนวยการ & ผู้เข้าร่วมสัมมนา)
function renderPeople() {
    peopleSectionsWrapper.innerHTML = '';

    const execCount = people.filter((p) => p.listType === 'executive').length;
    const actualCount = people.filter((p) => p.listType === 'actual').length;

    countAllTab.textContent = people.length;
    countExecTab.textContent = execCount;
    countActualTab.textContent = actualCount;

    const keyword = searchPersonInput.value.trim().toLowerCase();

    const filteredPeople = people.filter((person) => {
        if (activeFilterListType !== 'all' && person.listType !== activeFilterListType) return false;
        if (activeFilterSubGroup !== 'all' && person.subGroup !== activeFilterSubGroup) return false;

        const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
        const personPosNames = person.positionIds
            .map((id) => positions.find((p) => p.id === id)?.name.toLowerCase() || '')
            .join(' ');
        return fullName.includes(keyword) || personPosNames.includes(keyword);
    });

    personCountBadge.textContent = `${filteredPeople.length} รายการ`;

    if (filteredPeople.length === 0) {
        peopleSectionsWrapper.innerHTML = `
            <div class="text-center text-muted py-5 border rounded-3 bg-light">
                <i class="bi bi-person-x fs-1 d-block mb-2"></i>
                ${people.length === 0 ? 'ยังไม่มีรายชื่อบุคลากร กรุณากรอกชื่อ-นามสกุลด้านบน' : 'ไม่พบรายชื่อในหมวดหมู่ที่เลือก'}
            </div>
        `;
        return;
    }

    const typesToShow = activeFilterListType === 'all' ? ['executive', 'actual'] : [activeFilterListType];

    typesToShow.forEach((listType) => {
        const listPeople = filteredPeople.filter((p) => p.listType === listType);
        if (listPeople.length === 0) return;

        const sectionEl = document.createElement('div');
        sectionEl.className = 'mb-4 pb-2';

        const isExec = listType === 'executive';
        const headerBadgeClass = isExec ? 'bg-primary' : 'bg-success';
        const headerIcon = isExec ? 'bi-award-fill' : 'bi-person-workspace';

        sectionEl.innerHTML = `
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge ${headerBadgeClass} rounded-pill px-3 py-2 fs-6">
                        <i class="bi ${headerIcon} me-1"></i>${LIST_TYPE_LABELS[listType]}
                    </span>
                    <span class="text-muted small">(${listPeople.length} คน)</span>
                </div>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-outline-secondary btn-sm btn-export-section-csv" data-type="${listType}">
                        <i class="bi bi-filetype-csv me-1"></i> Report CSV หมวดนี้
                    </button>
                </div>
            </div>
        `;

        sectionEl.querySelector('.btn-export-section-csv').addEventListener('click', () => {
            exportToCsv(listType);
        });

        // แยกกลุ่มย่อย: กองอำนวยการ และ ผู้เข้าร่วมสัมมนา
        const subGroupsToShow =
            activeFilterSubGroup === 'all' ? ['directorate', 'participant'] : [activeFilterSubGroup];

        subGroupsToShow.forEach((subGroup) => {
            const subGroupPeople = listPeople.filter((p) => p.subGroup === subGroup);
            if (subGroupPeople.length === 0) return;

            const subGroupBlock = document.createElement('div');
            subGroupBlock.className = 'mb-3';

            const subIcon = subGroup === 'directorate' ? 'bi-building-fill-gear text-danger' : 'bi-people-fill text-info';

            subGroupBlock.innerHTML = `
                <h6 class="fw-bold mb-2 ps-1 d-flex align-items-center gap-2">
                    <i class="bi ${subIcon}"></i>
                    <span>${SUB_GROUP_LABELS[subGroup]}</span>
                    <span class="badge bg-secondary-subtle text-secondary-emphasis rounded-pill">${subGroupPeople.length} คน</span>
                </h6>
                <div class="row g-3 sub-group-cards"></div>
            `;

            const cardsRow = subGroupBlock.querySelector('.sub-group-cards');

            subGroupPeople.forEach((person) => {
                cardsRow.appendChild(createPersonCardElement(person));
            });

            sectionEl.appendChild(subGroupBlock);
        });

        peopleSectionsWrapper.appendChild(sectionEl);
    });
}

// สร้าง DOM การ์ดของแต่ละคน
function createPersonCardElement(person) {
    const col = document.createElement('div');
    col.className = 'col-md-6';

    const initials = person.firstName.charAt(0).toUpperCase();
    const isExec = person.listType === 'executive';

    let assignedBadgesHtml = '';
    if (person.positionIds.length === 0) {
        assignedBadgesHtml = `
            <div class="text-muted small text-center my-auto py-2 w-100">
                <i class="bi bi-arrow-down-circle me-1"></i>ลากตำแหน่งมาวางที่นี่ หรือกด <strong>+ ตำแหน่ง</strong>
            </div>
        `;
    } else {
        assignedBadgesHtml = person.positionIds
            .map((posId) => {
                const pos = positions.find((p) => p.id === posId);
                if (!pos) return '';
                return `
                    <span class="badge text-bg-${pos.color} rounded-pill d-inline-flex align-items-center gap-1 px-3 py-2">
                        <span>${escapeHtml(pos.name)}</span>
                        <button type="button" class="chip-remove-btn ms-1 btn-unassign" data-pos-id="${pos.id}" title="เอาตำแหน่งนี้ออก">
                            <i class="bi bi-x"></i>
                        </button>
                    </span>
                `;
            })
            .join('');
    }

    // ปุ่มดึงข้อมูลจาก 2.1 ไป 2.2 (แสดงในการ์ดของ 2.1 รายชื่อบริหาร)
    const copyToActualBtnHtml = isExec
        ? `
            <button type="button" class="btn btn-outline-success btn-sm btn-copy-to-actual" title="ดึงชื่อและตำแหน่งนี้ไปใส่ 2.2 รายชื่อทำงานจริง">
                <i class="bi bi-box-arrow-in-right"></i> ดึงไปทำงานจริง
            </button>
        `
        : '';

    col.innerHTML = `
        <div class="person-card p-3 h-100 d-flex flex-column justify-content-between" data-person-id="${person.id}">
            <div>
                <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <div class="avatar-circle shadow-sm ${isExec ? '' : 'bg-success'}">${escapeHtml(initials)}</div>
                        <div>
                            <h6 class="fw-bold mb-0">${escapeHtml(person.firstName)} ${escapeHtml(person.lastName)}</h6>
                            <div class="d-flex flex-wrap align-items-center gap-1 mt-1">
                                <span class="badge ${
                                    person.subGroup === 'directorate'
                                        ? 'bg-danger-subtle text-danger-emphasis'
                                        : 'bg-info-subtle text-info-emphasis'
                                } rounded-pill">
                                    ${SUB_GROUP_LABELS[person.subGroup]}
                                </span>
                                <small class="text-muted ms-1">(${person.positionIds.length} ตำแหน่ง)</small>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex flex-wrap justify-content-end gap-1">
                        ${copyToActualBtnHtml}
                        <button type="button" class="btn btn-outline-primary btn-sm btn-open-modal" title="เลือกเพิ่มตำแหน่ง">
                            <i class="bi bi-plus-lg"></i> ตำแหน่ง
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm btn-delete-person" title="ลบรายชื่อนี้">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>

                <div class="assigned-positions-zone d-flex flex-wrap gap-2 align-items-center mt-2">
                    ${assignedBadgesHtml}
                </div>
            </div>
        </div>
    `;

    const cardEl = col.querySelector('.person-card');

    // เหตุการณ์ Drag & Drop บนการ์ดของแต่ละคน
    cardEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        cardEl.classList.add('drag-over');
    });

    cardEl.addEventListener('dragleave', () => {
        cardEl.classList.remove('drag-over');
    });

    cardEl.addEventListener('drop', (e) => {
        e.preventDefault();
        cardEl.classList.remove('drag-over');
        const positionId = e.dataTransfer.getData('text/plain');
        if (positionId) {
            assignPositionToPerson(person.id, positionId);
        }
    });

    const copyBtn = col.querySelector('.btn-copy-to-actual');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            copySingleExecToActual(person.id);
        });
    }

    col.querySelector('.btn-open-modal').addEventListener('click', () => {
        openAssignModal(person.id);
    });

    col.querySelector('.btn-delete-person').addEventListener('click', () => {
        deletePerson(person.id);
    });

    col.querySelectorAll('.btn-unassign').forEach((btn) => {
        btn.addEventListener('click', () => {
            const posId = btn.dataset.posId;
            removePositionFromPerson(person.id, posId);
        });
    });

    return col;
}

// Render ตารางสรุปด้านล่าง
function renderSummaryTable() {
    summaryTableBody.innerHTML = '';

    if (people.length === 0) {
        summaryTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">ยังไม่มีข้อมูลบุคลากร</td>
            </tr>
        `;
        return;
    }

    people.forEach((person, index) => {
        const tr = document.createElement('tr');

        const badgesHtml =
            person.positionIds.length > 0
                ? person.positionIds
                      .map((posId) => {
                          const pos = positions.find((p) => p.id === posId);
                          if (!pos) return '';
                          return `<span class="badge text-bg-${pos.color} rounded-pill me-1 mb-1 px-3 py-2">${escapeHtml(
                              pos.name
                          )}</span>`;
                      })
                      .join('')
                : '<span class="text-muted small fst-italic">ยังไม่ได้ระบุตำแหน่ง</span>';

        const listTypeBadge =
            person.listType === 'executive'
                ? '<span class="badge bg-primary-subtle text-primary rounded-pill px-3 py-1">2.1 รายชื่อบริหาร</span>'
                : '<span class="badge bg-success-subtle text-success rounded-pill px-3 py-1">2.2 รายชื่อทำงานจริง</span>';

        const subGroupBadge =
            person.subGroup === 'directorate'
                ? '<span class="badge bg-danger-subtle text-danger-emphasis rounded-pill px-3 py-1">กองอำนวยการ</span>'
                : '<span class="badge bg-info-subtle text-info-emphasis rounded-pill px-3 py-1">ผู้เข้าร่วมสัมมนา</span>';

        tr.innerHTML = `
            <td class="ps-4 fw-medium text-secondary">${index + 1}</td>
            <td class="fw-semibold">${escapeHtml(person.firstName)} ${escapeHtml(person.lastName)}</td>
            <td>${listTypeBadge}</td>
            <td>${subGroupBadge}</td>
            <td>${badgesHtml}</td>
            <td class="text-center">
                <span class="badge bg-secondary-subtle text-secondary-emphasis rounded-pill px-3">
                    ${person.positionIds.length} ตำแหน่ง
                </span>
            </td>
        `;

        summaryTableBody.appendChild(tr);
    });
}

// ป้องกัน XSS
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
