// Function để vô hiệu hóa F12 và các phím tắt khác của DevTools
function disableDevTools() {
    document.addEventListener('keydown', (e) => {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'U')
        ) {
            e.preventDefault();
            console.log('Developer Tools are disabled.');
        }
    });
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    const threshold = 160;
    let devToolsOpen = false;
    window.addEventListener('resize', () => {
        if (
            window.outerWidth - window.innerWidth > threshold ||
            window.outerHeight - window.innerHeight > threshold
        ) {
            if (!devToolsOpen) {
                devToolsOpen = true;
                console.log('DevTools have been detected and an action has been taken.');
            }
        } else {
            devToolsOpen = false;
        }
    });
}
disableDevTools();

// Hiển thị thông báo tùy chỉnh
function showAlert(message, type) {
    const alertContainer = document.getElementById('custom-alert');
    const alertBox = alertContainer.querySelector('.alert-box');
    const alertIcon = document.getElementById('alert-icon');
    const alertMessage = document.getElementById('alert-message');
    const alertOkBtn = document.getElementById('alert-ok-btn');

    alertMessage.innerHTML = message;
    alertBox.className = `alert-box ${type}`;
    alertIcon.className = `alert-icon ${type}`;
    alertContainer.style.display = 'flex';

    alertOkBtn.onclick = function () {
        alertContainer.style.display = 'none';
    };
}

// Chuyển đổi giữa các trang
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`button[onclick="showPage('${pageId}')"]`).classList.add('active');

    if (pageId === 'page2') {
        renderTimetable();
        showTimetable('1');
    }
    if (pageId === 'page3') {
        updateRegisteredCoursesList();
    }
}

// Chuyển đổi giữa các thời khóa biểu Giai đoạn 1 và 2
function showTimetable(semester) {
    document.getElementById('timetable-gd1').style.display = 'none';
    document.getElementById('timetable-gd2').style.display = 'none';
    document.getElementById(`timetable-gd${semester}`).style.display = 'block';

    document.querySelectorAll('.timetable-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`button[onclick="showTimetable('${semester}')"]`).classList.add('active');
}

// Xử lý logic hiển thị trường địa điểm
document.getElementById('location-type').addEventListener('change', function () {
    const campusField = document.getElementById('campus-location-field');
    const locationInput = document.getElementById('location');
    if (this.value === 'campus') {
        campusField.style.display = 'flex';
        locationInput.required = true;
    } else {
        campusField.style.display = 'none';
        locationInput.required = false;
    }
});

let registeredCourses = [];

// Chuẩn hóa giá trị "Giai đoạn"
function normalizeSemesterWeek(value) {
    const v = value.trim();
    if (v === '1' || v.toLowerCase() === 'giai đoạn 1') return 'Giai đoạn 1';
    if (v === '2' || v.toLowerCase() === 'giai đoạn 2') return 'Giai đoạn 2';
    if (
        v === 'Cả 2 giai đoạn' ||
        v === '1,2' ||
        v === '2,1' ||
        v.toLowerCase() === 'cả 2 giai đoạn'
    ) return 'Cả 2 giai đoạn';
    return v;
}

// Chuyển đổi thời gian dạng "HH:mm" thành phút
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Chuyển đổi nhãn giai đoạn thành mã giai đoạn
function getSemestersFromLabel(label) {
    if (label === 'Giai đoạn 1') {
        return ['1'];
    } else if (label === 'Giai đoạn 2') {
        return ['2'];
    } else if (label === 'Cả 2 giai đoạn') {
        return ['1', '2'];
    }
    return [];
}

// Render lại toàn bộ thời khóa biểu
function renderTimetable() {
    const tables = {
        '1': document.getElementById('table-gd1').querySelector('tbody'),
        '2': document.getElementById('table-gd2').querySelector('tbody')
    };
    tables['1'].innerHTML = '';
    tables['2'].innerHTML = '';

    const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const timeSlots = [
        "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
        "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
        "19:00", "20:00", "21:00"
    ];

    for (const semester of ['1', '2']) {
        const occupiedCells = new Set();
        const coursesToRender = registeredCourses.filter(course =>
            getSemestersFromLabel(course.semesterWeek).includes(semester)
        );

        for (let i = 0; i < timeSlots.length; i++) {
            const row = document.createElement('tr');
            row.innerHTML = `<td class="time-label">${timeSlots[i]}</td>`;

            for (let j = 0; j < daysOfWeek.length; j++) {
                const day = daysOfWeek[j];
                const cellKey = `${timeSlots[i]}-${day}`;

                if (occupiedCells.has(cellKey)) {
                    continue;
                }

                const course = coursesToRender.find(c => {
                    const courseStartHour = c.time.split('-')[0];
                    return c.dayOfWeek === day && courseStartHour.substring(0, 2) === timeSlots[i].substring(0, 2);
                });

                if (course) {
                    const [startTime, endTime] = course.time.split('-');
                    const startMin = timeToMinutes(startTime);
                    const endMin = timeToMinutes(endTime);
                    const durationInHours = (endMin - startMin) / 60;
                    const rowspan = Math.ceil(durationInHours);

                    for (let k = 0; k < rowspan; k++) {
                        if (i + k < timeSlots.length) {
                            occupiedCells.add(`${timeSlots[i + k]}-${day}`);
                        }
                    }

                    const location = course.locationType === 'online' ? 'Online' : course.location;
                    row.innerHTML += `
                        <td rowspan="${rowspan}" class="${course.locationType}-class">
                            <strong>${course.classCode}</strong><br/>
                            ${location}<br/>
                            (${course.time})
                        </td>
                    `;
                } else {
                    row.innerHTML += `<td></td>`;
                }
            }
            tables[semester].appendChild(row);
        }
    }
}

// Xử lý form khi submit
document.getElementById('course-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const semesterWeekRaw = document.getElementById('semester-week').value;
    const semesterWeek = normalizeSemesterWeek(semesterWeekRaw);

    if (!['Giai đoạn 1', 'Giai đoạn 2', 'Cả 2 giai đoạn'].includes(semesterWeek)) {
        showAlert('Vui lòng chọn đúng giá trị cho trường "Tuần học".', 'error');
        return;
    }

    const courseData = {
        id: Date.now(),
        courseName: document.getElementById('course-name').value,
        classCode: document.getElementById('class-code').value,
        regCode: document.getElementById('reg-code').value,
        semesterWeek: semesterWeek,
        dayOfWeek: document.getElementById('day-of-week').value.toUpperCase(),
        time: document.getElementById('time').value,
        locationType: document.getElementById('location-type').value,
        location: (document.getElementById('location-type').value === 'online') ? 'Online' : document.getElementById('location').value,
        lecturer: document.getElementById('lecturer').value,
        credits: document.getElementById('credits').value
    };

    const semesters = getSemestersFromLabel(courseData.semesterWeek);
    const day = courseData.dayOfWeek;
    const [startTime, endTime] = courseData.time.split('-');
    const startTimeInMin = timeToMinutes(startTime);
    const endTimeInMin = timeToMinutes(endTime);

    // Kiểm tra trùng lịch
    let isConflict = false;
    for (const existingCourse of registeredCourses) {
        const existingSemesters = getSemestersFromLabel(existingCourse.semesterWeek);
        const hasCommonSemester = existingSemesters.some(s => semesters.includes(s));
        if (hasCommonSemester && existingCourse.dayOfWeek === day) {
            const [existingStartTime, existingEndTime] = existingCourse.time.split('-');
            const existingStartTimeInMin = timeToMinutes(existingStartTime);
            const existingEndTimeInMin = timeToMinutes(existingEndTime);

            if (Math.max(startTimeInMin, existingStartTimeInMin) < Math.min(endTimeInMin, existingEndTimeInMin)) {
                isConflict = true;
                showAlert(
                    `Lỗi: Lịch học bị trùng. Môn bạn đang cố gắng đăng ký trùng với môn **${existingCourse.courseName}** vào lúc **${existingCourse.time}**.`,
                    'error'
                );
                break;
            }
        }
    }

    if (isConflict) {
        return;
    }

    registeredCourses.push(courseData);
    registeredCourses.sort((a, b) => timeToMinutes(a.time.split('-')[0]) - timeToMinutes(b.time.split('-')[0]));
    renderTimetable();
    showAlert('Đăng ký môn học thành công!', 'success');
    document.getElementById('course-form').reset();
    document.getElementById('campus-location-field').style.display = 'none';
});

// Cập nhật danh sách môn đã đăng ký và tổng tín chỉ
function updateRegisteredCoursesList() {
    const tbody = document.getElementById('registered-courses-body');
    tbody.innerHTML = '';
    let totalCredits = 0;

    registeredCourses.forEach((course, index) => {
        const row = tbody.insertRow();
        const semesterLabel = course.semesterWeek;
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${course.courseName}</td>
            <td>${course.classCode}</td>
            <td>${course.regCode}</td>
            <td>${semesterLabel}</td>
            <td>${course.credits}</td>
            <td>${course.lecturer}</td>
            <td><button class="remove-btn" onclick="removeCourse(${course.id})">Xóa</button></td>
        `;
        totalCredits += parseInt(course.credits, 10);
    });

    document.getElementById('total-credits').textContent = totalCredits;
}

// Xóa môn học
function removeCourse(courseId) {
    registeredCourses = registeredCourses.filter(c => c.id !== courseId);
    renderTimetable();
    updateRegisteredCoursesList();
}

// Hàm xuất dữ liệu ra file JSON
function exportData() {
    if (registeredCourses.length === 0) {
        showAlert('Không có dữ liệu để xuất.', 'error');
        return;
    }
    const dataStr = JSON.stringify(registeredCourses, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thoi-khoa-bieu.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAlert('Xuất file thành công!', 'success');
}

// Hàm tải dữ liệu từ file JSON
function loadData(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const loadedData = JSON.parse(e.target.result);
            if (!Array.isArray(loadedData) || !loadedData.every(item => item.courseName && item.classCode)) {
                throw new Error('Định dạng file không hợp lệ.');
            }
            registeredCourses = loadedData;
            renderTimetable();
            updateRegisteredCoursesList();
            showAlert('Tải dữ liệu thành công!', 'success');
        } catch (error) {
            console.error('Lỗi khi tải file:', error);
            showAlert('Định dạng file không hợp lệ. Vui lòng tải file JSON đúng định dạng.', 'error');
        }
    };
    reader.onerror = function() {
        showAlert('Lỗi khi đọc file. Vui lòng thử lại.', 'error');
    };
    reader.readAsText(file);
}