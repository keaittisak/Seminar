// คีย์เดียวกับหน้าจัดการหลักเพื่อดึงข้อมูลเดียวกันจาก LocalStorage
const STORAGE_KEY_PEOPLE = 'webapp_people_list_v2';
const STORAGE_KEY_POSITIONS = 'webapp_positions_list_v2';

const LIST_TYPE_LABELS = {
    executive: '2.1 รายชื่อบริหาร',
    actual: '2.2 รายชื่อทำงานจริง'
};

const SUB_GROUP_LABELS = {
    directorate: 'กองอำนวยการ',
    participant: 'ผู้เข้าร่วมสัมมนา'
};

const DEFAULT_POSITIONS = [
    { id: 'pos-1', name: 'ประธานโครงการ', color: 'primary' },
    { id: 'pos-2', name: 'หัวหน้ากองอำนวยการ', color: 'danger' },
    { id: 'pos-3', name: 'วิทยากรหลัก', color: 'success' },
    { id: 'pos-4', name: 'ฝ่ายประสานงาน', color: 'info' },
    { id: 'pos-5', name: 'ฝ่ายทะเบียนและต้อนรับ', color: 'warning' },
    { id: 'pos-6', name: 'ฝ่ายโสตทัศนูปกรณ์ / IT', color: 'dark' }
];

const DEFAULT_PEOPLE = [
    {
        id: 'emp-1',
        firstName: 'สมชาย',
        lastName: 'สายบริหาร',
        listType: 'executive',
        subGroup: 'directorate',
        positionIds: ['pos-1', 'pos-2']
    },
    {
        id: 'emp-2',
        firstName: 'วิภาวี',
        lastName: 'วิชาการเด่น',
        listType: 'executive',
        subGroup: 'participant',
        positionIds: ['pos-3']
    },
    {
        id: 'emp-3',
        firstName: 'สมชาย',
        lastName: 'สายบริหาร',
        listType: 'actual',
        subGroup: 'directorate',
        positionIds: ['pos-1', 'pos-2', 'pos-4']
    },
    {
        id: 'emp-4',
        firstName: 'กิตติพงศ์',
        lastName: 'คล่องแคล่ว',
        listType: 'actual',
        subGroup: 'participant',
        positionIds: ['pos-5', 'pos-6']
    }
];

let positions = [];
let people = [];

// อ้างอิง DOM
const statExecTotal = document.getElementById('statExecTotal');
const statExecSubText = document.getElementById('statExecSubText');
const statActualTotal = document.getElementById('statActualTotal');
const statActualSubText = document.getElementById('statActualSubText');
const statTotalPositions = document.getElementById('statTotalPositions');
const statMultiPosText = document.getElementById('statMultiPosText');
const statTotalAssignments = document.getElementById('statTotalAssignments');
const statTotalPeopleText = document.getElementById('statTotalPeopleText');

const tbodyExecDirectorate = document.getElementById('tbodyExecDirectorate');
const tbodyExecParticipant = document.getElementById('tbodyExecParticipant');
const tbodyActualDirectorate = document.getElementById('tbodyActualDirectorate');
const tbodyActualParticipant = document.getElementById('tbodyActualParticipant');

const summaryByPersonTableBody = document.getElementById('summaryByPersonTableBody');
const fullPositionSummaryGrid = document.getElementById('fullPositionSummaryGrid');

const summarySearchInput = document.getElementById('summarySearchInput');
const btnPrintSummary = document.getElementById('btnPrintSummary');

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupExportButtons();
    renderSummaryAll();
});

window.addEventListener('storage', () => {
    loadData();
    renderSummaryAll();
});

function loadData() {
    const savedPositions = localStorage.getItem(STORAGE_KEY_POSITIONS);
    const savedPeople = localStorage.getItem(STORAGE_KEY_PEOPLE);

    if (savedPositions && savedPeople) {
        positions = JSON.parse(savedPositions);
        people = JSON.parse(savedPeople);
    } else {
        positions = [...DEFAULT_POSITIONS];
        people = JSON.parse(JSON.stringify(DEFAULT_PEOPLE));
        localStorage.setItem(STORAGE_KEY_POSITIONS, JSON.stringify(positions));
        localStorage.setItem(STORAGE_KEY_PEOPLE, JSON.stringify(people));
    }
}

function setupExportButtons() {
    document.querySelectorAll('[data-export-csv]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-export-csv');
            exportSummaryCsv(mode);
        });
    });

    summarySearchInput.addEventListener('input', () => {
        renderSummaryAll();
    });

    btnPrintSummary.addEventListener('click', () => {
        window.print();
    });
}

function renderSummaryAll() {
    const keyword = summarySearchInput.value.trim().toLowerCase();

    renderStats();
    renderSplitTables(keyword);
    renderPersonSummary(keyword);
    renderPositionSummary(keyword);
}

// 1. สถิติภาพรวม
function renderStats() {
    const execList = people.filter((p) => p.listType === 'executive');
    const execDir = execList.filter((p) => p.subGroup === 'directorate').length;
    const execPart = execList.filter((p) => p.subGroup === 'participant').length;

    const actualList = people.filter((p) => p.listType === 'actual');
    const actualDir = actualList.filter((p) => p.subGroup === 'directorate').length;
    const actualPart = actualList.filter((p) => p.subGroup === 'participant').length;

    const multiPosCount = people.filter((p) => p.positionIds.length > 1).length;
    const totalAssignments = people.reduce((sum, p) => sum + p.positionIds.length, 0);

    statExecTotal.textContent = execList.length;
    statExecSubText.textContent = `กองอำนวยการ ${execDir} | ผู้เข้าร่วม ${execPart}`;

    statActualTotal.textContent = actualList.length;
    statActualSubText.textContent = `กองอำนวยการ ${actualDir} | ผู้เข้าร่วม ${actualPart}`;

    statTotalPositions.textContent = positions.length;
    statMultiPosText.textContent = `ถือหลายตำแหน่ง ${multiPosCount} รายการ`;

    statTotalAssignments.textContent = totalAssignments;
    statTotalPeopleText.textContent = `จากทั้งหมด ${people.length} รายการ`;
}

// 2. แสดงตารางแยก 2.1 รายชื่อบริหาร และ 2.2 รายชื่อทำงานจริง (กองอำนวยการ / ผู้เข้าร่วมสัมมนา)
function renderSplitTables(keyword) {
    const filterByKeyword = (list) =>
        list.filter((person) => {
            const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
            const posNames = person.positionIds
                .map((id) => positions.find((p) => p.id === id)?.name.toLowerCase() || '')
                .join(' ');
            return fullName.includes(keyword) || posNames.includes(keyword);
        });

    renderSubTable(
        tbodyExecDirectorate,
        filterByKeyword(people.filter((p) => p.listType === 'executive' && p.subGroup === 'directorate'))
    );
    renderSubTable(
        tbodyExecParticipant,
        filterByKeyword(people.filter((p) => p.listType === 'executive' && p.subGroup === 'participant'))
    );
    renderSubTable(
        tbodyActualDirectorate,
        filterByKeyword(people.filter((p) => p.listType === 'actual' && p.subGroup === 'directorate'))
    );
    renderSubTable(
        tbodyActualParticipant,
        filterByKeyword(people.filter((p) => p.listType === 'actual' && p.subGroup === 'participant'))
    );
}

function renderSubTable(tbodyEl, list) {
    tbodyEl.innerHTML = '';

    if (list.length === 0) {
        tbodyEl.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted py-4 small">ไม่มีรายชื่อในหมวดนี้</td>
            </tr>
        `;
        return;
    }

    list.forEach((person, idx) => {
        const tr = document.createElement('tr');
        const badgesHtml =
            person.positionIds.length > 0
                ? person.positionIds
                      .map((posId) => {
                          const pos = positions.find((p) => p.id === posId);
                          if (!pos) return '';
                          return `<span class="badge text-bg-${pos.color} rounded-pill me-1 mb-1">${escapeHtml(
                              pos.name
                          )}</span>`;
                      })
                      .join('')
                : '<span class="text-muted small fst-italic">ยังไม่มีตำแหน่ง</span>';

        tr.innerHTML = `
            <td class="ps-3 text-secondary small">${idx + 1}</td>
            <td class="fw-semibold">${escapeHtml(person.firstName)} ${escapeHtml(person.lastName)}</td>
            <td>${badgesHtml}</td>
        `;
        tbodyEl.appendChild(tr);
    });
}

// 3. ตารางสรุปรวมทุกคน
function renderPersonSummary(keyword) {
    const filteredPeople = people.filter((person) => {
        const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
        const posNames = person.positionIds
            .map((id) => positions.find((p) => p.id === id)?.name.toLowerCase() || '')
            .join(' ');
        return fullName.includes(keyword) || posNames.includes(keyword);
    });

    summaryByPersonTableBody.innerHTML = '';

    if (filteredPeople.length === 0) {
        summaryByPersonTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-5">ไม่พบข้อมูลบุคลากร</td>
            </tr>
        `;
        return;
    }

    filteredPeople.forEach((person, index) => {
        const assignedPositions = person.positionIds
            .map((posId) => positions.find((p) => p.id === posId))
            .filter(Boolean);

        const badgesHtml =
            assignedPositions.length > 0
                ? assignedPositions
                      .map(
                          (pos) =>
                              `<span class="badge text-bg-${pos.color} rounded-pill me-1 mb-1 px-3 py-2">${escapeHtml(
                                  pos.name
                              )}</span>`
                      )
                      .join('')
                : '<span class="badge bg-light text-secondary border rounded-pill px-3 py-2">ยังไม่มีตำแหน่ง</span>';

        const listTypeBadge =
            person.listType === 'executive'
                ? '<span class="badge bg-primary-subtle text-primary rounded-pill px-3 py-1">2.1 รายชื่อบริหาร</span>'
                : '<span class="badge bg-success-subtle text-success rounded-pill px-3 py-1">2.2 รายชื่อทำงานจริง</span>';

        const subGroupBadge =
            person.subGroup === 'directorate'
                ? '<span class="badge bg-danger-subtle text-danger-emphasis rounded-pill px-3 py-1">กองอำนวยการ</span>'
                : '<span class="badge bg-info-subtle text-info-emphasis rounded-pill px-3 py-1">ผู้เข้าร่วมสัมมนา</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ps-4 fw-medium text-secondary">${index + 1}</td>
            <td class="fw-semibold">${escapeHtml(person.firstName)} ${escapeHtml(person.lastName)}</td>
            <td>${listTypeBadge}</td>
            <td>${subGroupBadge}</td>
            <td>${badgesHtml}</td>
            <td class="text-center">
                <span class="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                    ${assignedPositions.length} ตำแหน่ง
                </span>
            </td>
        `;
        summaryByPersonTableBody.appendChild(tr);
    });
}

// 4. สรุปตามตำแหน่งงาน
function renderPositionSummary(keyword) {
    const filteredPositions = positions.filter((pos) => {
        const posNameMatch = pos.name.toLowerCase().includes(keyword);
        const members = people.filter((person) => person.positionIds.includes(pos.id));
        const memberMatch = members.some((m) =>
            `${m.firstName} ${m.lastName}`.toLowerCase().includes(keyword)
        );
        return posNameMatch || memberMatch;
    });

    fullPositionSummaryGrid.innerHTML = '';

    if (filteredPositions.length === 0) {
        fullPositionSummaryGrid.innerHTML = `
            <div class="col-12 text-center text-muted py-5">ไม่พบข้อมูลตำแหน่งงาน</div>
        `;
        return;
    }

    filteredPositions.forEach((pos) => {
        const members = people.filter((person) => person.positionIds.includes(pos.id));

        const membersListHtml =
            members.length > 0
                ? members
                      .map(
                          (m) => `
                        <div class="d-flex justify-content-between align-items-center p-2 rounded border bg-light-subtle">
                            <span class="fw-medium small">
                                <i class="bi bi-person-fill text-${pos.color} me-1"></i>
                                ${escapeHtml(m.firstName)} ${escapeHtml(m.lastName)}
                            </span>
                            <div class="d-flex gap-1">
                                <span class="badge ${
                                    m.listType === 'executive' ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success'
                                } rounded-pill">${m.listType === 'executive' ? 'บริหาร' : 'ทำงานจริง'}</span>
                                <span class="badge bg-secondary-subtle text-secondary rounded-pill">${
                                    SUB_GROUP_LABELS[m.subGroup]
                                }</span>
                            </div>
                        </div>
                    `
                      )
                      .join('')
                : '<span class="text-muted small fst-italic">ยังไม่มีผู้ดำรงตำแหน่งนี้</span>';

        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
            <div class="card border h-100 shadow-sm rounded-4">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge text-bg-${pos.color} rounded-pill px-3 py-2 fs-6">
                            ${escapeHtml(pos.name)}
                        </span>
                        <span class="fw-bold text-secondary">${members.length} คน</span>
                    </div>
                    <div class="small text-muted mb-2 fw-medium">รายชื่อบุคลากรในตำแหน่งนี้:</div>
                    <div class="d-flex flex-column gap-2">
                        ${membersListHtml}
                    </div>
                </div>
            </div>
        `;
        fullPositionSummaryGrid.appendChild(col);
    });
}

// 5. ฟังก์ชัน Report ออกมาเป็น CSV ครบทุกรูปแบบ
function exportSummaryCsv(mode) {
    let headers = [];
    let rows = [];
    let filename = 'Report_Summary';

    if (mode === 'by-position') {
        headers = ['ลำดับ', 'ชื่อตำแหน่ง', 'จำนวนคน', 'รายชื่อคนในตำแหน่ง (หมวด/กลุ่มย่อย)'];
        rows = positions.map((pos, idx) => {
            const members = people.filter((p) => p.positionIds.includes(pos.id));
            const memberStr = members
                .map(
                    (m) =>
                        `${m.firstName} ${m.lastName} (${LIST_TYPE_LABELS[m.listType]} - ${SUB_GROUP_LABELS[m.subGroup]})`
                )
                .join(' | ');
            return [idx + 1, pos.name, members.length, memberStr || 'ไม่มี'];
        });
        filename = 'Report_สรุปตามตำแหน่งงาน';
    } else {
        let filtered = [...people];

        if (mode === 'executive') {
            filtered = people.filter((p) => p.listType === 'executive');
            filename = 'Report_2.1_รายชื่อบริหาร_ทั้งหมด';
        } else if (mode === 'executive-directorate') {
            filtered = people.filter((p) => p.listType === 'executive' && p.subGroup === 'directorate');
            filename = 'Report_2.1_รายชื่อบริหาร_กองอำนวยการ';
        } else if (mode === 'executive-participant') {
            filtered = people.filter((p) => p.listType === 'executive' && p.subGroup === 'participant');
            filename = 'Report_2.1_รายชื่อบริหาร_ผู้เข้าร่วมสัมมนา';
        } else if (mode === 'actual') {
            filtered = people.filter((p) => p.listType === 'actual');
            filename = 'Report_2.2_รายชื่อทำงานจริง_ทั้งหมด';
        } else if (mode === 'actual-directorate') {
            filtered = people.filter((p) => p.listType === 'actual' && p.subGroup === 'directorate');
            filename = 'Report_2.2_รายชื่อทำงานจริง_กองอำนวยการ';
        } else if (mode === 'actual-participant') {
            filtered = people.filter((p) => p.listType === 'actual' && p.subGroup === 'participant');
            filename = 'Report_2.2_รายชื่อทำงานจริง_ผู้เข้าร่วมสัมมนา';
        } else {
            filename = 'Report_สรุปคนและตำแหน่งทั้งหมด';
        }

        headers = [
            'ลำดับ',
            'หมวดรายชื่อ',
            'กลุ่มย่อย',
            'ชื่อ',
            'นามสกุล',
            'ชื่อ-นามสกุล',
            'ตำแหน่งที่ได้รับ',
            'จำนวนตำแหน่ง'
        ];

        rows = filtered.map((person, idx) => {
            const posNames = person.positionIds
                .map((id) => positions.find((p) => p.id === id)?.name)
                .filter(Boolean)
                .join(' | ');

            return [
                idx + 1,
                LIST_TYPE_LABELS[person.listType] || person.listType,
                SUB_GROUP_LABELS[person.subGroup] || person.subGroup,
                person.firstName,
                person.lastName,
                `${person.firstName} ${person.lastName}`,
                posNames || 'ยังไม่ได้ระบุตำแหน่ง',
                person.positionIds.length
            ];
        });
    }

    const csvContent =
        '\uFEFF' +
        [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
