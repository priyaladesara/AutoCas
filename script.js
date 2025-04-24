// Global Variables
let detectionActive = false;
let attendanceData = [];
let expectedStudents = 78; // Total expected students
let refreshInterval;
let manualMarkActive = false;
let detectionInterval = null;
let videoElement = null;
let lastAttendanceUpdate = Date.now();
let pendingRequests = 0;

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
    if (dateInput) {
        const datePicker = flatpickr(dateInput, {
            dateFormat: "M d, Y",
            defaultDate: new Date(),
            disableMobile: "true"
        });
    }
    
    // Initialize session time dropdown
    const sessionInput = document.getElementById('sessionInput');
    if (sessionInput) {
        populateSessionTimes(sessionInput);
    }
    
    // Load initial student data if available
    if (attendanceData.length === 0) {
        // Sample student data if none exists
        attendanceData = [
        ];
    }
    
    // Update UI
    updateAttendanceTable();
    updateAttendanceStats();

    // Add these data structures at the top of your file, below your existing global variables
const academicData = {
    sem6: {
      courses: [
        { id: 'cs601', name: 'Communication Skills' },
        { id: 'cs602', name: 'Embedded Systems' },
        { id: 'cs603', name: 'AI and Communications' },
        { id: 'cs604', name: 'Computer Networks' },
        { id: 'cs605', name: 'Industry 4.0' },
        { id: 'cs606', name: 'Cloud Architecture' },
        { id: 'cs607', name: 'Web Technologies' },
        { id: 'cs608', name: 'Machine Learning' },
        { id: 'cs609', name: 'Deep Learning' }
      ],
      divisions: ['Division 1', 'Division 2', 'Division 3']
    }
    // Add more semesters as needed
  };
  
  // Initialize a structured student data storage
  let studentsDataByCourse = {};
  
  // Add these functions to your script.js
  
  // Function to initialize student data structures
  function initializeStudentData() {
    Object.keys(academicData).forEach(semester => {
      studentsDataByCourse[semester] = {};
      
      academicData[semester].divisions.forEach(division => {
        studentsDataByCourse[semester][division] = {};
        
        academicData[semester].courses.forEach(course => {
          // Create an empty student list for each course
          studentsDataByCourse[semester][division][course.id] = [];
        });
      });
    });
  }
  
  // Function to populate selection dropdowns
  function populateSelectionDropdowns() {
    // Populate semester dropdown
    const semesterSelect = document.getElementById('semesterSelect');
    if (semesterSelect) {
      semesterSelect.innerHTML = '';
      
      Object.keys(academicData).forEach(semester => {
        const option = document.createElement('option');
        option.value = semester;
        option.textContent = semester.charAt(0).toUpperCase() + semester.slice(1);
        semesterSelect.appendChild(option);
      });
      
      // Trigger change to populate division dropdown
      semesterSelect.dispatchEvent(new Event('change'));
    }
  }
  
  // Function to populate division dropdown based on selected semester
  function populateDivisionDropdown() {
    const semesterSelect = document.getElementById('semesterSelect');
    const divisionSelect = document.getElementById('divisionSelect');
    
    if (semesterSelect && divisionSelect) {
      const selectedSemester = semesterSelect.value;
      divisionSelect.innerHTML = '';
      
      academicData[selectedSemester].divisions.forEach(division => {
        const option = document.createElement('option');
        option.value = division.replace(/\s+/g, '').toLowerCase();
        option.textContent = division;
        divisionSelect.appendChild(option);
      });
      
      // Trigger change to populate course dropdown
      divisionSelect.dispatchEvent(new Event('change'));
    }
  }
  
  // Function to populate course dropdown based on selected semester
  function populateCourseDropdown() {
    const semesterSelect = document.getElementById('semesterSelect');
    const courseSelect = document.getElementById('courseSelect');
    
    if (semesterSelect && courseSelect) {
      const selectedSemester = semesterSelect.value;
      courseSelect.innerHTML = '';
      
      academicData[selectedSemester].courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = course.name;
        courseSelect.appendChild(option);
      });
      
      // Load students for the selected values
      loadStudentsForSelection();
    }
  }
  
  // Function to load students based on semester, division and course
  function loadStudentsForSelection() {
    const semesterSelect = document.getElementById('semesterSelect');
    const divisionSelect = document.getElementById('divisionSelect');
    const courseSelect = document.getElementById('courseSelect');
    
    if (semesterSelect && divisionSelect && courseSelect) {
      const semester = semesterSelect.value;
      const division = academicData[semester].divisions.find(div => 
        div.replace(/\s+/g, '').toLowerCase() === divisionSelect.value);
      const courseId = courseSelect.value;
      
      // If we have students stored for this combination, use them
      if (studentsDataByCourse[semester] && 
          studentsDataByCourse[semester][division] && 
          studentsDataByCourse[semester][division][courseId]) {
        
        attendanceData = studentsDataByCourse[semester][division][courseId].slice();
        
        // If this is the first time loading this course, initialize with sample data
        if (attendanceData.length === 0) {
          // Generate some sample students for this course
          attendanceData = generateSampleStudents(courseId, 78);
          
          // Store in our structure
          studentsDataByCourse[semester][division][courseId] = attendanceData.slice();
        }
        
        // Update the UI
        updateAttendanceTable();
        updateAttendanceStats();
        
        // Update class name display
        const classDisplay = document.getElementById('classInput');
        if (classDisplay) {
          const courseName = academicData[semester].courses.find(c => c.id === courseId).name;
          classDisplay.value = `${courseName} (${division})`;
        }
      }
    }
  }
  
  // Function to generate sample students for a course
  function generateSampleStudents(courseId, count) {
    const students = [];
    const coursePrefix = courseId.substring(0, 2).toUpperCase();
    
    for (let i = 1; i <= count; i++) {
      const rollNo = i.toString().padStart(3, '0');
      students.push({
        id: `${coursePrefix}${rollNo}`,
        name: `Student ${rollNo}`,
        status: 'Absent',
        time: '—'
      });
    }
    
    return students;
  }
  
  // Function to save attendance data for current selection
  function saveCurrentAttendanceData() {
    const semesterSelect = document.getElementById('semesterSelect');
    const divisionSelect = document.getElementById('divisionSelect');
    const courseSelect = document.getElementById('courseSelect');
    
    if (semesterSelect && divisionSelect && courseSelect) {
      const semester = semesterSelect.value;
      const division = academicData[semester].divisions.find(div => 
        div.replace(/\s+/g, '').toLowerCase() === divisionSelect.value);
      const courseId = courseSelect.value;
      
      // Save current attendance data
      if (studentsDataByCourse[semester] && 
          studentsDataByCourse[semester][division]) {
        studentsDataByCourse[semester][division][courseId] = attendanceData.slice();
      }
    }
  }
  
  // Modify your DOMContentLoaded event listener to include the new functionality
  document.addEventListener('DOMContentLoaded', () => {
      // Initialize the student data structure
      initializeStudentData();
      
      // Initialize UI and fetch any existing data
      updateAttendanceStats();
      
      // Initialize selection dropdowns if they exist
      if (document.getElementById('semesterSelect')) {
          populateSelectionDropdowns();
          
          // Add event listeners for the dropdowns
          document.getElementById('semesterSelect').addEventListener('change', populateDivisionDropdown);
          document.getElementById('divisionSelect').addEventListener('change', populateCourseDropdown);
          document.getElementById('courseSelect').addEventListener('change', loadStudentsForSelection);
      }
      
      // Initialize date picker with Flatpickr
      const dateInput = document.getElementById('dateInput');
      if (dateInput) {
          const datePicker = flatpickr(dateInput, {
              dateFormat: "M d, Y",
              defaultDate: new Date(),
              disableMobile: "true"
          });
      }
      
      // Initialize session time dropdown
      const sessionInput = document.getElementById('sessionInput');
      if (sessionInput) {
          populateSessionTimes(sessionInput);
      }
      
      // Load initial student data if available
      if (attendanceData.length === 0) {
          // If no existing data, generate for default selection
          loadStudentsForSelection();
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
      
      // Find video element
      videoElement = document.getElementById('videoFeed');
      
      console.log('JavaScript file loaded successfully');
  });
  
  // Modify the resetAttendance function to save data before resetting
  function resetAttendance() {
      // First save current data
      saveCurrentAttendanceData();
      
      // Then try with server
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
  
  // Modify the exportToExcel function to include course information
  function exportToExcel() {
      // Save the current data first
      saveCurrentAttendanceData();
      
      // Get course information
      const semesterSelect = document.getElementById('semesterSelect');
      const divisionSelect = document.getElementById('divisionSelect');
      const courseSelect = document.getElementById('courseSelect');
      
      let semesterText = '';
      let divisionText = '';
      let courseText = '';
      
      if (semesterSelect && divisionSelect && courseSelect) {
          semesterText = semesterSelect.options[semesterSelect.selectedIndex].text;
          divisionText = divisionSelect.options[divisionSelect.selectedIndex].text;
          courseText = courseSelect.options[courseSelect.selectedIndex].text;
      }
      
      // Get class name and date
      const className = document.getElementById('classInput') ? 
                       document.getElementById('classInput').value : courseText;
      const dateInput = document.getElementById('dateInput');
      const date = dateInput ? dateInput.value : new Date().toLocaleDateString();
      
      // Get the current session time if available
      let sessionTime = 'Session';
      const sessionInput = document.getElementById('sessionInput');
      if (sessionInput) {
          sessionTime = sessionInput.options[sessionInput.selectedIndex].text;
      }
      
      // Add header row for CSV with additional metadata
      const metadataRows = [
          `Semester,${semesterText}`,
          `Division,${divisionText}`,
          `Course,${courseText}`,
          `Date,${date}`,
          `Session,${sessionTime}`,
          ``,  // Empty row as separator
      ];
      
      const headerRow = "ID,Name,Status,Time";
      
      // Use Blob and URL.createObjectURL for more efficient file creation
      const rows = [...metadataRows, headerRow];
      attendanceData.forEach(e => {
          rows.push(`${e.id},${e.name},${e.status},${e.time}`);
      });
      
      const csvContent = rows.join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      
      // Include course in the filename
      const fileName = `${courseText.replace(/\s+/g, '_')}_${date.replace(/,\s/g, '_').replace(/\s/g, '_')}_${sessionTime.replace(/:/g, '').replace(/\s/g, '')}.csv`;
      link.setAttribute("download", fileName);
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(function() {
          document.body.removeChild(link);
          URL.revokeObjectURL(url); // Free up memory
      }, 100);
      
      showNotification('Attendance data exported to Excel', 'success');
  }
    
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
    
    // Find video element
    videoElement = document.getElementById('videoFeed');
    
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

// Function to toggle face detection with optimized streaming
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
                    
                    // Start periodic attendance data refresh (optimized)
                    startAttendanceRefresh();
                    
                    // Start live video feed with improved method
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
                stopDetection();
            })
            .catch(error => {
                console.error('Error stopping detection:', error);
                showNotification('Error stopping detection system', 'error');
                
                // Fall back to manual stop if server connection fails
                stopDetection();
            });
    }
}

// Helper function to stop detection
function stopDetection() {
    detectionActive = false;
    detectionBtn.textContent = 'Start Detection';
    detectionBtn.classList.remove('active');
    detectionBtn.className = 'btn btn-primary';
    
    // Stop periodic refresh
    clearInterval(refreshInterval);
    
    // Stop video detection
    stopVideoDetection();
}

// Optimized video streaming using efficient loading of video feed
function startVideoDetection() {
    if (!videoElement) {
        // Try to find or create video element
        videoElement = document.getElementById('videoFeed');
        
        if (!videoElement) {
            // If not found, see if there's a container we can add it to
            const videoContainer = document.querySelector('.video-container');
            
            if (videoContainer) {
                videoElement = document.createElement('img');
                videoElement.id = 'videoFeed';
                videoElement.style.width = '100%';
                videoElement.style.maxHeight = '480px';
                videoElement.style.objectFit = 'contain';
                videoContainer.appendChild(videoElement);
            }
        }
    }
    
    if (videoElement) {
        // Set up streaming with cache busting to prevent stale images
        const streamUrl = `/video_feed?nocache=${Date.now()}`;
        
        if (videoElement.tagName.toLowerCase() === 'img') {
            // For img element, set source with cache busting
            videoElement.src = streamUrl;
            
            // Set up periodic refresh to ensure stream doesn't freeze
            if (detectionInterval) clearInterval(detectionInterval);
            
            detectionInterval = setInterval(() => {
                if (detectionActive) {
                    videoElement.src = `/video_feed?nocache=${Date.now()}`;
                }
            }, 10000); // Refresh source every 10 seconds to prevent freezing
        }
    }
    
    // Fallback to simulation with intelligent random updates
    if (detectionInterval) {
        clearInterval(detectionInterval);
    }
    
    detectionInterval = setInterval(() => {
        // Pick a random student who is currently absent, but only if we're not
        // getting real updates from the server
        const now = Date.now();
        if ((now - lastAttendanceUpdate) > 5000 && pendingRequests === 0) {
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
        }
    }, 5000); // Every 5 seconds
}

// Function to stop video detection
function stopVideoDetection() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    
    // Clear video element
    if (videoElement) {
        videoElement.src = '';
    }
}

// Function to start periodic attendance data refresh with rate limiting
function startAttendanceRefresh() {
    // Clear any existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Set up new interval (refresh every 3 seconds - increased from 2 for better performance)
    refreshInterval = setInterval(() => {
        // Don't send a new request if one is already pending
        if (pendingRequests > 0) return;
        
        pendingRequests++;
        fetch('/get_attendance')
            .then(response => response.json())
            .then(data => {
                pendingRequests--;
                attendanceData = data;
                lastAttendanceUpdate = Date.now(); // Track when we last got real data
                
                // Only update UI if there's actually new data
                if (data.length > 0) {
                    // Use more efficient DOM operations by batching updates
                    // and only updating what changed
                    updateAttendanceTable();
                    updateAttendanceStats();
                }
            })
            .catch(error => {
                pendingRequests--;
                console.error('Error fetching attendance data:', error);
            });
    }, 10000);
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

// Function to update attendance table with optimized DOM manipulation
function updateAttendanceTable() {
    // Filter data based on search input
    const searchTerm = searchInput.value.toLowerCase();
    const filteredData = attendanceData.filter(entry => 
        entry.name.toLowerCase().includes(searchTerm) || 
        entry.id.toString().includes(searchTerm)
    );
    
    // Optimize by updating only changed rows instead of clearing and recreating everything
    
    // First, get all current rows
    const currentRows = Array.from(attendanceTable.querySelectorAll('tr'));
    const currentIds = currentRows.map(row => row.dataset.studentId);
    
    // Keep track of rows we've updated
    const updatedIds = [];
    
    // Update or add rows
    filteredData.forEach(entry => {
        let row = currentRows.find(r => r.dataset.studentId === String(entry.id));
        updatedIds.push(String(entry.id));
        
        if (row) {
            // Update existing row
            const cells = row.querySelectorAll('td');
            
            // Update only if data changed
            if (cells[0].textContent !== String(entry.id)) cells[0].textContent = entry.id;
            if (cells[1].textContent !== entry.name) cells[1].textContent = entry.name;
            
            // Update status badge
            const statusBadge = cells[2].querySelector('.status-badge');
            if (statusBadge.textContent !== entry.status) {
                statusBadge.textContent = entry.status;
                statusBadge.className = `status-badge ${getStatusClass(entry.status)}`;
                if (manualMarkActive) {
                    statusBadge.classList.add('status-editable');
                }
            }
            
            if (cells[3].textContent !== entry.time) cells[3].textContent = entry.time;
            
        } else {
            // Create new row
            const row = document.createElement('tr');
            row.dataset.studentId = entry.id;
            
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
        }
    });
    
    // Remove rows that are no longer in the filtered data
    currentRows.forEach(row => {
        if (!updatedIds.includes(row.dataset.studentId)) {
            row.remove();
        }
    });
}

// Function to filter attendance table based on search input
function filterAttendanceTable() {
    updateAttendanceTable();
}
// Fix the toggleStatus function by ensuring proper ID comparison
function toggleStatus(e) {
    if (!manualMarkActive) return;
    
    const studentId = e.target.dataset.studentId;
    // Convert studentId to match the data type in attendanceData (string to string or number to number)
    const student = attendanceData.find(s => String(s.id) === String(studentId));
    
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
            const seconds = now.getSeconds();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            const formattedMins = String(mins).padStart(2, '0');
            student.time = `${formattedHours}:${formattedMins} ${ampm}`;
        }
        
        // Re-render with updated data
        updateAttendanceTable();
        
        // Update statistics after status change
        updateAttendanceStats();
        
        // Show notification about status change
        showNotification(`${student.name}'s status changed to ${student.status}`, 'info');
    }
}

// Enhance updateAttendanceTable function to properly add event listeners
function updateAttendanceTable() {
    // Filter data based on search input
    const searchTerm = searchInput.value.toLowerCase();
    const filteredData = attendanceData.filter(entry => 
        entry.name.toLowerCase().includes(searchTerm) || 
        entry.id.toString().includes(searchTerm)
    );
    
    // First, get all current rows
    const currentRows = Array.from(attendanceTable.querySelectorAll('tr'));
    const currentIds = currentRows.map(row => row.dataset.studentId);
    
    // Keep track of rows we've updated
    const updatedIds = [];
    
    // Update or add rows
    filteredData.forEach(entry => {
        let row = currentRows.find(r => r.dataset.studentId === String(entry.id));
        updatedIds.push(String(entry.id));
        
        if (row) {
            // Update existing row
            const cells = row.querySelectorAll('td');
            
            // Update only if data changed
            if (cells[0].textContent !== String(entry.id)) cells[0].textContent = entry.id;
            if (cells[1].textContent !== entry.name) cells[1].textContent = entry.name;
            
            // Update status badge
            const statusBadge = cells[2].querySelector('.status-badge');
            if (statusBadge) {
                if (statusBadge.textContent !== entry.status) {
                    statusBadge.textContent = entry.status;
                    statusBadge.className = `status-badge ${getStatusClass(entry.status)}`;
                }
                
                // Add or remove editable class based on manualMarkActive state
                if (manualMarkActive) {
                    statusBadge.classList.add('status-editable');
                    
                    // Remove existing event listener to prevent duplicates
                    statusBadge.removeEventListener('click', toggleStatus);
                    // Add new event listener
                    statusBadge.addEventListener('click', toggleStatus);
                } else {
                    statusBadge.classList.remove('status-editable');
                    statusBadge.removeEventListener('click', toggleStatus);
                }
            }
            
            if (cells[3].textContent !== entry.time) cells[3].textContent = entry.time;
            
        } else {
            // Create new row
            const row = document.createElement('tr');
            row.dataset.studentId = entry.id;
            
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
            
            // If manual mark is active, make badge editable and add event listener
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
        }
    });
    
    // Remove rows that are no longer in the filtered data
    currentRows.forEach(row => {
        if (!updatedIds.includes(row.dataset.studentId)) {
            row.remove();
        }
    });
}

// Improve toggleManualMark function to handle existing status badges properly
function toggleManualMark() {
    manualMarkActive = !manualMarkActive;
    
    if (manualMarkActive) {
        manualMarkBtn.classList.add('active');
        manualMarkBtn.textContent = 'Exit Manual Mark';
        
        // Re-render table to add editable class and event listeners
        updateAttendanceTable();
        
        showNotification('Manual mark mode activated. Click on status badges to toggle attendance.', 'info');
    } else {
        manualMarkBtn.classList.remove('active');
        manualMarkBtn.textContent = 'Manual Mark';
        
        // Re-render table to remove editable class and event listeners
        updateAttendanceTable();
        
        showNotification('Manual mark mode deactivated', 'info');
    }
}


// Function to toggle student status on click (for manual mark mode)

    
    // Function to update attendance statistics more efficiently
    function updateAttendanceStats() {
        const present = attendanceData.filter(entry => entry.status === 'Present').length;
        const absent = expectedStudents - present;
        const rate = (present / expectedStudents) * 100;
        
        // Only update DOM if values have changed
        if (presentCount.textContent !== String(present)) {
            presentCount.textContent = present;
        }
        
        if (absentCount.textContent !== String(absent)) {
            absentCount.textContent = absent;
        }
        
        const formattedRate = `${Math.round(rate)}%`;
        if (attendanceRate.textContent !== formattedRate) {
            attendanceRate.textContent = formattedRate;
        }
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
    
    // Optimized notification system - limit number of simultaneous notifications
    const MAX_NOTIFICATIONS = 3;
    let activeNotifications = [];
    
    // Function to show a notification with rate limiting
    function showNotification(message, type = 'info') {
        // Limit number of notifications
        if (activeNotifications.length >= MAX_NOTIFICATIONS) {
            // Remove oldest notification
            if (activeNotifications.length > 0) {
                const oldest = activeNotifications.shift();
                oldest.remove();
            }
        }
        
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
        
        // Check for duplicate notifications
        const existingNotifications = document.querySelectorAll('.notification p');
        for (let i = 0; i < existingNotifications.length; i++) {
            if (existingNotifications[i].textContent === message) {
                // Duplicate found, don't create another one
                return;
            }
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<p>${message}</p>`;
        
        document.getElementById('notificationsContainer').appendChild(notification);
        activeNotifications.push(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
            // Remove from active notifications array
            const index = activeNotifications.indexOf(notification);
            if (index !== -1) {
                activeNotifications.splice(index, 1);
            }
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
    
    // Export to Excel/CSV function with more efficient data handling
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
        
        // Use Blob and URL.createObjectURL for more efficient file creation
        const rows = [headerRow];
        attendanceData.forEach(e => {
            rows.push(`${e.id},${e.name},${e.status},${e.time}`);
        });
        
        const csvContent = rows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        
        // Include current date in the filename
        const fileName = `attendance_${date.replace(/,\s/g, '_').replace(/\s/g, '_')}_${sessionTime.replace(/:/g, '').replace(/\s/g, '')}.csv`;
        link.setAttribute("download", fileName);
        
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(function() {
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // Free up memory
        }, 100);
        
        showNotification('Attendance data exported to Excel', 'success');
    }
    
    
    // Handle window click to close modal
    window.onclick = function(event) {
        if (manualMarkModal && event.target == manualMarkModal) {
            closeManualMarkModal();
        }
    };