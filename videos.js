

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

async function fetchVideos() {
    const videos = [];
    const footageRef = db.collection('footage');
    const snapshot = await footageRef.get();

    for (const doc of snapshot.docs) {
        const videoData = doc.data();
        // Assume videoData contains userId pointing to a user document
        const userRef = db.collection('users').doc(videoData.userId);
        const userSnapshot = await userRef.get();
        const userData = userSnapshot.data();

        const userProfilePhotoURL = userData.profilePhoto && userData.profilePhoto !== "" ? userData.profilePhoto : defaultImgUrl;

        // Construct the video object including user info and video details
        const video = {
            videoURL: videoData.videoURL,
            dateTaken: videoData.dateTaken, // Firestore Timestamp object
            length: videoData.duration,
            locationStr : videoData.locationString,
            userName: userData.name,
            userPhotoURL: userProfilePhotoURL
        };

        videos.push(video);
    }

    return videos;
}

let previewsContainer = document.getElementById('previews-container')


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

    });
}

displayVideos();
