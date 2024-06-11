const defaultImgUrl = "https://firebasestorage.googleapis.com/v0/b/locale-e7a62.appspot.com/o/Image%20copy.png?alt=media&token=eb362744-427e-460d-913a-76b433600395";


// The createDOMElement function as provided
function createDOMElement(type, className, value, parent) {
    let DOMElement = document.createElement(type);
    DOMElement.setAttribute('class', className);
    if (type == 'img') {
        DOMElement.src = value;
    } else {
        DOMElement.innerHTML = value;
    }
    parent.appendChild(DOMElement);
    return DOMElement
}

// Function to format date
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date.seconds * 1000).toLocaleDateString('en-US', options);
}

// Function to format video length
function formatLength(lengthInSeconds) {
    lengthInSeconds = Math.round(lengthInSeconds); // Round to nearest whole number
    const minutes = Math.floor(lengthInSeconds / 60);
    const seconds = lengthInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}


const db = firebase.firestore();
let paymentPerUpload = 7; // Default value in case the config is not set or fetched



async function fetchVideos() {
    const videos = [];
    const footageRef = db.collection('footage').orderBy('dateTaken', 'desc'); // Sorting by dateTaken in descending order
    const snapshot = await footageRef.get();

    for (const doc of snapshot.docs) {
        const videoData = doc.data();
        const userRef = db.collection('users').doc(videoData.userId);
        const userSnapshot = await userRef.get();
        const userData = userSnapshot.data();

        const userProfilePhotoURL = userData.profilePhoto && userData.profilePhoto !== "" ? userData.profilePhoto : defaultImgUrl;

        const video = {
            id: doc.id,
            videoURL: videoData.videoURL,
            dateTaken: videoData.dateTaken,
            length: videoData.duration,
            locationStr: videoData.locationString,
            userName: userData.name,
            userPhotoURL: userProfilePhotoURL,
            userId: videoData.userId,
            status: videoData.status
        };

        videos.push(video);
    }

    return videos;
}

let previewsContainer = document.getElementById('previews-container')


// Set up a realtime listener for the paymentPerUpload value
db.collection('config').doc('config')
    .onSnapshot(docSnapshot => {
        const configData = docSnapshot.data();
        if (configData && configData.paymentPerUpload) {
            paymentPerUpload = configData.paymentPerUpload;
        }
    }, err => {
        console.log(`Encountered error: ${err}`);
    });



// Assuming you have a function to fetch video data and user data
async function displayVideos() {
    while (previewsContainer.firstChild) {
        previewsContainer.removeChild(previewsContainer.firstChild)
    }
    const videos = await fetchVideos();

    videos.forEach(video => {
        const videoContainer = createDOMElement('div', 'video-preview-container', '', previewsContainer )
        const subContainer = createDOMElement('div', 'video-preview-subcontainer', '', videoContainer )
        const videoPreviewDiv = createDOMElement('div', 'video-preview-div', '', subContainer )

        var videoElement = createDOMElement('video', 'video-preview', '', videoPreviewDiv)
        videoElement.src = video.videoURL;
        videoPreviewDiv.firstChild.setAttribute('controls', true);

        const datetimeContainer = createDOMElement('div', 'video-datetime-container', '', videoPreviewDiv)

        createDOMElement('span', 'filter-text', formatDate(video.dateTaken), datetimeContainer);
        createDOMElement('span', 'video-time-text', formatLength(video.length), datetimeContainer);

        const infoContainer = document.createElement('div');
        infoContainer.setAttribute('class', 'video-info-container');
        subContainer.appendChild(infoContainer);

        const profileDiv = document.createElement('div');
        profileDiv.setAttribute('class', 'video-preview-profile-div');
        infoContainer.appendChild(profileDiv);

        createDOMElement('img', 'current-user-profile-image', video.userPhotoURL, profileDiv);
        const profileInfo = createDOMElement('div', 'profile-info', "", profileDiv);
        createDOMElement('div', 'filter-text', video.userName, profileInfo);
        createDOMElement('div', 'filter-text', video.locationStr, profileInfo);

        const videoActionsDiv = createDOMElement('div', 'video-actions-div', '', infoContainer)
        if (video.status == "PAID" || video.status == "DENIED") {
            createDOMElement('div', 'status-button', video.status, videoActionsDiv);
        } else {
            let approveButton = createDOMElement('div', 'approve-button', `APPROVE: $${paymentPerUpload}`, videoActionsDiv);
            let declineButton = createDOMElement('div', 'deny-button', "DENY", videoActionsDiv);

            approveButton.onclick = async function() {
                const videoRef = db.collection('footage').doc(video.id);
                await videoRef.update({status: "PAID"});
                const userRef = db.collection('users').doc(video.userId);
                await userRef.update({balance: firebase.firestore.FieldValue.increment(paymentPerUpload)});
                updateVideoStatusDisplay(videoContainer, "PAID"); // Update the status display instead of refreshing the entire list
            };

            declineButton.onclick = async function() {
                const videoRef = db.collection('footage').doc(video.id);
                await videoRef.update({status: "DENIED"});
                updateVideoStatusDisplay(videoContainer, "DENIED"); // Update the status display instead of refreshing the entire list
            };
        }
    });
}

// This function updates the visual representation of a video's status
function updateVideoStatusDisplay(videoContainer, newStatus) {
    const statusDiv = videoContainer.querySelector('.video-actions-div .status-button');
    if (statusDiv) {
        statusDiv.innerText = newStatus; // Update the text if the status div already exists
    } else {
        const videoActionsDiv = videoContainer.querySelector('.video-actions-div');
        videoActionsDiv.innerHTML = ""
        createDOMElement('div', 'status-button', newStatus, videoActionsDiv); // Create a new status div if it doesn't exist
    }
}

displayVideos();
