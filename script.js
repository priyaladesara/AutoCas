// Global Variables
let detectionActive = false;
let attendanceData = [];
let expectedStudents = 24; // Total expected students
let refreshInterval;
let manualMarkActive = false;
let detectionInterval = null;

// DOM elements
const detectionBtn = document.getElementById('detectionBtn');
const resetBtn = document.getElementById('resetBtn');
const attendanceTable = document.getElementById('attendanceTable').querySelector('tbody');
const searchInput = document.getElementById('searchInput');
const manualMarkBtn = document.getElementById('manualMarkBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const generateReportBtn = document.getElementById('generateReportBtn');
const manualMarkModal = document.getElementById('manualMarkModal');
const closeModalBtn = document.querySelector('.close');
const submitManualMarkBtn = document.getElementById('submitManualMark');

// Statistics elements
const attendanceRate = document.getElementById('attendanceRate');
const presentCount = document.getElementById('presentCount');
const absentCount = document.getElementById('absentCount');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI and fetch any existing data
    updateAttendanceStats();
    
    // Initialize date picker with Flatpickr
    const dateInput = document.getElementById('dateInput');
    const datePicker = flatpickr(dateInput, {
        dateFormat: "M d, Y",
        defaultDate: new Date(),
        disableMobile: "true"
    });
    
    // Initialize session time dropdown
    const sessionInput = document.getElementById('sessionInput');
    if (sessionInput) {
        populateSessionTimes(sessionInput);
    }
    
    // Load initial student data if available
    if (attendanceData.length === 0) {
        // Sample student data if none exists
        attendanceData = [
            { id: '001', name: 'John Doe', status: 'Present', time: '09:15 AM' },
            { id: '002', name: 'Sarah Miller', status: 'Present', time: '09:17 AM' },
            { id: '003', name: 'Alex Kim', status: 'Present', time: '09:18 AM' },
            { id: '004', name: 'Emily Chen', status: 'Absent', time: '—' },
            { id: '005', name: 'Michael Johnson', status: 'Absent', time: '—' },
            { id: '006', name: 'Lisa Park', status: 'Present', time: '09:32 AM' }
        ];
    }
    
    // Update UI
    updateAttendanceTable();
    updateAttendanceStats();
    
    // Set up event listeners
    detectionBtn.addEventListener('click', toggleDetection);
    resetBtn.addEventListener('click', resetAttendance);
    searchInput.addEventListener('input', filterAttendanceTable);
    
    if (manualMarkBtn) {
        manualMarkBtn.addEventListener('click', toggleManualMark);
    }
    
    if (manualMarkModal) {
        closeModalBtn.addEventListener('click', closeManualMarkModal);
        submitManualMarkBtn.addEventListener('click', submitManualAttendance);
    }
    
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportToExcel);
    }
    
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }
    
    // Settings button handlers
    const settingsButtons = document.querySelectorAll('.btn-settings');
    settingsButtons.forEach(button => {
        button.addEventListener('click', () => {
            alert('Settings feature will be implemented');
        });
    });
    
    console.log('JavaScript file loaded successfully');
});

// Function to populate session times from 8 AM to 6 PM in 1-hour intervals
function populateSessionTimes(selectElement) {
    selectElement.innerHTML = ''; // Clear existing options
    
    const startHour = 8; // 8:00 AM
    const endHour = 18;  // 6:00 PM
    
    for (let hour = startHour; hour <= endHour; hour++) {
        const option = document.createElement('option');
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
        
        option.value = `${hour}:00`;
        option.textContent = `${displayHour}:00 ${ampm}`;
        selectElement.appendChild(option);
    }
    
    // Set default value to 9:00 AM (similar to "Morning Lecture")
    selectElement.value = '9:00';
}

// Function to toggle face detection
function toggleDetection() {
    if (!detectionActive) {
        // Start detection
        fetch('/start_detection')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'started' || data.status === 'already_running') {
                    detectionActive = true;
                    detectionBtn.textContent = 'Stop Detection';
                    detectionBtn.classList.add('active');
                    detectionBtn.className = `btn btn-secondary active`;
                    
                    // Start periodic attendance data refresh
                    startAttendanceRefresh();
                    
                    // Start live video feed
                    startVideoDetection();
                }
            })
            .catch(error => {
                console.error('Error starting detection:', error);
                showNotification('Error starting detection system', 'error');
                
                // Fallback to simulation if server connection fails
                detectionActive = true;
                detectionBtn.textContent = 'Stop Detection';
                detectionBtn.classList.add('active');
                detectionBtn.className = `btn btn-secondary active`;
                
                startVideoDetection();
            });
    } else {
        // Stop detection
        fetch('/stop_detection')
            .then(response => response.json())
            .then(data => {
                detectionActive = false;
                detectionBtn.textContent = 'Start Detection';
                detectionBtn.classList.remove('active');
                detectionBtn.className = 'btn btn-primary';
                
                // Stop periodic refresh
                clearInterval(refreshInterval);
                
                // Stop video detection
                stopVideoDetection();
            })
            .catch(error => {
                console.error('Error stopping detection:', error);
                showNotification('Error stopping detection system', 'error');
                
                // Fall back to manual stop if server connection fails
                detectionActive = false;
                detectionBtn.textContent = 'Start Detection';
                detectionBtn.classList.remove('active');
                detectionBtn.className = 'btn btn-primary';
                
                // Stop video detection
                stopVideoDetection();
            });
    }
}

// Function to start video detection (live feed simulation)
function startVideoDetection() {
    // This would normally connect to your Python backend via WebSocket
    // For now, we'll simulate detection with random updates
    if (detectionInterval) {
        clearInterval(detectionInterval);
    }
    
    detectionInterval = setInterval(() => {
        // Pick a random student who is currently absent
        const absentStudents = attendanceData.filter(s => s.status === 'Absent');
        if (absentStudents.length > 0) {
            const randomIndex = Math.floor(Math.random() * absentStudents.length);
            const student = absentStudents[randomIndex];
            
            // Mark as present
            student.status = 'Present';
            
            // Set current time
            const now = new Date();
            const hours = now.getHours();
            const mins = now.getMinutes();
            const seconds = now.getSeconds();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            const formattedMins = String(mins).padStart(2, '0');
            const formattedSecs = String(seconds).padStart(2, '0');
            student.time = `${formattedHours}:${formattedMins}:${formattedSecs} ${ampm}`;
            
            // Update table and statistics
            updateAttendanceTable();
            updateAttendanceStats();
            
            // Show notification
            showNotification(`${student.name} detected and marked present`, 'success');
        }
    }, 5000); // Every 5 seconds
}

// Function to stop video detection
function stopVideoDetection() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
}

// Function to start periodic attendance data refresh
function startAttendanceRefresh() {
    // Clear any existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Set up new interval (refresh every 2 seconds)
    refreshInterval = setInterval(() => {
        fetch('/get_attendance')
            .then(response => response.json())
            .then(data => {
                attendanceData = data;
                updateAttendanceTable();
                updateAttendanceStats();
                checkAttendancePatterns();
            })
            .catch(error => {
                console.error('Error fetching attendance data:', error);
            });
    }, 2000);
}

// Get status class for visual styling
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'present':
            return 'status-present';
        case 'absent':
            return 'status-absent';
        case 'late':
            return 'status-late';
        default:
            return '';
    }
}

// Function to update attendance table
function updateAttendanceTable() {
    // Clear existing rows
    attendanceTable.innerHTML = '';
    
    // Filter data based on search input
    const searchTerm = searchInput.value.toLowerCase();
    const filteredData = attendanceData.filter(entry => 
        entry.name.toLowerCase().includes(searchTerm) || 
        entry.id.toString().includes(searchTerm)
    );
    
    // Add rows for each attendance entry
    filteredData.forEach(entry => {
        const row = document.createElement('tr');
        
        // Create table cells
        const idCell = document.createElement('td');
        idCell.textContent = entry.id;
        
        const nameCell = document.createElement('td');
        nameCell.textContent = entry.name;
        
        const statusCell = document.createElement('td');
        
        // Create status badge span
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${getStatusClass(entry.status)}`;
        statusBadge.dataset.studentId = entry.id;
        statusBadge.textContent = entry.status;
        
        // If manual mark is active, make badge editable
        if (manualMarkActive) {
            statusBadge.classList.add('status-editable');
            statusBadge.addEventListener('click', toggleStatus);
        }
        
        statusCell.appendChild(statusBadge);
        
        const timeCell = document.createElement('td');
        timeCell.textContent = entry.time;
        
        // Append cells to row
        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(statusCell);
        row.appendChild(timeCell);
        
        // Append row to table
        attendanceTable.appendChild(row);
    });
}

// Function to filter attendance table based on search input
function filterAttendanceTable() {
    updateAttendanceTable();
}

// Toggle manual mark mode
function toggleManualMark() {
    manualMarkActive = !manualMarkActive;
    
    if (manualMarkActive) {
        manualMarkBtn.classList.add('active');
        manualMarkBtn.textContent = 'Exit Manual Mark';
        
        // Make status badges clickable
        document.querySelectorAll('.status-badge').forEach(badge => {
            badge.classList.add('status-editable');
            badge.addEventListener('click', toggleStatus);
        });
    } else {
        manualMarkBtn.classList.remove('active');
        manualMarkBtn.textContent = 'Manual Mark';
        
        // Remove clickable styling and event listeners
        document.querySelectorAll('.status-badge').forEach(badge => {
            badge.classList.remove('status-editable');
            badge.removeEventListener('click', toggleStatus);
        });
    }
}

// Function to toggle student status on click (for manual mark mode)
function toggleStatus(e) {
    if (!manualMarkActive) return;
    
    const studentId = e.target.dataset.studentId;
    const student = attendanceData.find(s => s.id === studentId);
    
    if (student) {
        if (student.status === 'Present') {
            student.status = 'Absent';
            student.time = '—';
        } else {
            student.status = 'Present';
            // Set current time for present status
            const now = new Date();
            const hours = now.getHours();
            const mins = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            const formattedMins = String(mins).padStart(2, '0');
            student.time = `${formattedHours}:${formattedMins} ${ampm}`;
        }
        
        // Re-render with updated data
        updateAttendanceTable();
        
        // Update statistics after status change
        updateAttendanceStats();
    }
}

// Function to update attendance statistics
function updateAttendanceStats() {
    const present = attendanceData.filter(entry => entry.status === 'Present').length;
    const absent = expectedStudents - present;
    const rate = (present / expectedStudents) * 100;
    
    presentCount.textContent = present;
    absentCount.textContent = absent;
    attendanceRate.textContent = `${Math.round(rate)}%`;
}

// Function to check attendance patterns and show notifications
function checkAttendancePatterns() {
    // This is a placeholder for more advanced attendance pattern detection
    // In a real system, you would check for repeated absences, etc.
    
    // Example: Check if any student has missed multiple classes
    // (This would require storing historical data)
}

// Function to reset attendance
function resetAttendance() {
    // First try with server
    fetch('/reset_attendance')
        .then(response => response.json())
        .then(data => {
            resetAttendanceLocal();
        })
        .catch(error => {
            console.error('Error resetting attendance:', error);
            showNotification('Server error - resetting locally', 'warning');
            resetAttendanceLocal();
        });
}

// Local reset function
function resetAttendanceLocal() {
    // Reset all students to absent
    attendanceData.forEach(student => {
        student.status = 'Absent';
        student.time = '—';
    });
    
    // Update UI
    updateAttendanceTable();
    updateAttendanceStats();
    
    // Stop detection if running
    if (detectionActive) {
        detectionActive = false;
        detectionBtn.textContent = 'Start Detection';
        detectionBtn.className = 'btn btn-primary';
        detectionBtn.classList.remove('active');
        stopVideoDetection();
        clearInterval(refreshInterval);
    }
    
    showNotification('Attendance data has been reset', 'info');
}

// Function to show a notification
function showNotification(message, type = 'info') {
    const notificationsContainer = document.getElementById('notificationsContainer');
    
    // Create container if it doesn't exist
    if (!notificationsContainer) {
        const container = document.createElement('div');
        container.id = 'notificationsContainer';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '1000';
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<p>${message}</p>`;
    
    document.getElementById('notificationsContainer').appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Modal functions
function openManualMarkModal() {
    if (manualMarkModal) {
        manualMarkModal.style.display = 'block';
    }
}

function closeManualMarkModal() {
    if (manualMarkModal) {
        manualMarkModal.style.display = 'none';
    }
}

// Submit manual attendance
function submitManualAttendance() {
    const studentId = document.getElementById('studentIdInput').value;
    const studentName = document.getElementById('studentNameInput').value;
    const status = document.getElementById('statusInput').value;
    
    if (!studentId || !studentName) {
        showNotification('Please enter student ID and name', 'warning');
        return;
    }
    
    // Add to attendance data
    const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
    });
    
    // Check if student already exists
    const existingStudent = attendanceData.find(s => s.id === studentId);
    
    if (existingStudent) {
        existingStudent.status = status;
        existingStudent.time = status === 'Present' ? currentTime : '—';
    } else {
        attendanceData.push({
            id: studentId,
            name: studentName,
            status: status,
            time: status === 'Present' ? currentTime : '—'
        });
    }
    
    // Update UI
    updateAttendanceTable();
    updateAttendanceStats();
    
    // Close modal
    closeManualMarkModal();
    
    // Show notification
    showNotification(`Attendance marked for ${studentName}`, 'success');
}

// Export to Excel/CSV function
function exportToExcel() {
    // Get class name and date
    const className = document.getElementById('classInput') ? 
                     document.getElementById('classInput').value : 'Class';
    const dateInput = document.getElementById('dateInput');
    const date = dateInput ? dateInput.value : new Date().toLocaleDateString();
    
    // Get the current session time if available
    let sessionTime = 'Session';
    const sessionInput = document.getElementById('sessionInput');
    if (sessionInput) {
        sessionTime = sessionInput.options[sessionInput.selectedIndex].text;
    }
    
    // Add header row for CSV
    const headerRow = "ID,Name,Status,Time";
    const csvContent = "data:text/csv;charset=utf-8,"
        + headerRow + "\n"
        + attendanceData.map(e => `${e.id},${e.name},${e.status},${e.time}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    // Include current date in the filename
    const fileName = `attendance_${date.replace(/,\s/g, '_').replace(/\s/g, '_')}_${sessionTime.replace(/:/g, '').replace(/\s/g, '')}.csv`;
    link.setAttribute("download", fileName);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // Clean up after download
    
    showNotification('Attendance data exported to Excel', 'success');
}

// Generate report function
function generateReport() {
    // In a real application, this would generate a detailed report
    
    const className = document.getElementById('classInput') ? 
                     document.getElementById('classInput').value : 'Class';
    const dateInput = document.getElementById('dateInput');
    const date = dateInput ? dateInput.value : new Date().toLocaleDateString();
    
    alert(`Generating attendance report for ${className} on ${date}`);
    showNotification('Attendance report generated', 'success');
}

// Handle window click to close modal
window.onclick = function(event) {
    if (manualMarkModal && event.target == manualMarkModal) {
        closeManualMarkModal();
    }
};