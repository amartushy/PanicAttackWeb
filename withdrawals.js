// Assuming db is already initialized and points to your Firestore instance
const db = firebase.firestore();
const bankImage = "https://firebasestorage.googleapis.com/v0/b/locale-e7a62.appspot.com/o/Screenshot%202024-03-16%20at%2012.57.10%E2%80%AFPM.png?alt=media&token=da8919da-3446-4084-bb4a-b8aabd274815";
const paypalImage = "https://firebasestorage.googleapis.com/v0/b/locale-e7a62.appspot.com/o/paypal.png?alt=media&token=1a63bce2-b2b5-453a-8f18-fd5b8a3ff2f6";
const profileContainer = document.getElementById('profile-preview-container');


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


async function fetchAllWithdrawalsAndBuildBlocks() {
    const withdrawalsContainer = document.getElementById('withdrawals-container'); // Ensure you have this in your HTML

    while (withdrawalsContainer.firstChild) {
        withdrawalsContainer.removeChild(withdrawalsContainer.firstChild);
    }

    try {
        const withdrawalsSnapshot = await db.collection('withdrawals').get();
        for (let doc of withdrawalsSnapshot.docs) {
            const withdrawal = doc.data();
            const userDetails = await fetchUserDetailsByID(withdrawal.userID);
            buildWithdrawalBlock(doc.id, userDetails, withdrawal.dateWithdrawn, withdrawal.amount, withdrawal.type, withdrawal.status);
        }
    } catch (error) {
        console.error("Error fetching withdrawals: ", error);
    }
}

function buildWithdrawalBlock(withdrawalID, user, date, amount, type, status) {
    let rowBlock = document.createElement('div');
    rowBlock.className = 'row-block';
    rowBlock.addEventListener('click', () => showProfilePreview(user, date, amount, status));

    var userNameBlock = createDOMElement('div', 'row-name-div','', rowBlock );
    createDOMElement('img', 'user-photo', user.userPhoto, userNameBlock);
    createDOMElement('div', 'text-light', user.userName, userNameBlock);

    // Date
    let withdrawalDate = new Date(date.seconds * 1000); // Convert Firestore timestamp to JavaScript Date object
    let withdrawalDiv = createDOMElement('div', 'row-text-div', '', rowBlock);
    createDOMElement('div', 'text-light', withdrawalDate.toLocaleDateString(), withdrawalDiv);
    
    // Amount and Type
    let paymentTypeClass = type === 'paypal' ? 'withdrawal-paypal' : 'withdrawal-bank';
    let amountDiv = createDOMElement('div', 'user-text-div', '', rowBlock);
    let imageSrc = type === 'paypal' ? paypalImage : bankImage;
    createDOMElement('img', paymentTypeClass, imageSrc, amountDiv);
    createDOMElement('div', 'text-light', `$${amount}`, amountDiv);
    
    // Status
    let statusClass = `status-${status.toLowerCase()}`;
    let statusDiv = createDOMElement('div', `row-block-20`, '', rowBlock);
    createDOMElement('div', `${statusClass} text-light`, status, statusDiv);
    
    // Actions
    let actionsBlock = createDOMElement('div', 'user-actions-block', '', rowBlock);
    
    // Actions - Only if status is 'unpaid'
    if (status.toLowerCase() === 'unpaid') {
        
        let payButton = createDOMElement('button', 'pay-button', 'Pay', actionsBlock);
        payButton.onclick = function() { updateWithdrawalStatus(withdrawalID, 'paid'); };
        
        let declineButton = createDOMElement('button', 'decline-button', 'Decline', actionsBlock);
        declineButton.onclick = function() { updateWithdrawalStatus(withdrawalID, 'declined'); };
        
        rowBlock.appendChild(actionsBlock);
    }

    // Append the rowBlock to the container
    document.getElementById('withdrawals-container').appendChild(rowBlock);
}

async function fetchUserDetailsByID(userID) {
    try {
        const userDoc = await db.collection('users').doc(userID).get();
        if (!userDoc.exists) {
            console.log('No such user!');
            return { userID: "Unknown", userName: "Unknown Name", userPhoto: "path/to/default/photo" }; // Defaults if user not found
        }
        const userData = userDoc.data();
        return {
        userID: userDoc.id, // Correctly referencing the document ID
        userName: userData.name || "Unknown Name",
        userPhoto: userData.profilePhoto || "path/to/default/photo" // Provide a default photo URL if none is set
        };
    } catch (error) {
        console.error("Error fetching user details: ", error);
        return { userID: "Error", userName: "Error", userPhoto: "path/to/default/photo" }; // Handle error with defaults
    }
}


async function updateWithdrawalStatus(withdrawalID, newStatus) {
    try {
        await db.collection('withdrawals').doc(withdrawalID).update({
            status: newStatus
        });
        console.log(`Withdrawal ${withdrawalID} status updated to ${newStatus}`);
        // Optionally, refresh the list or UI element to reflect the status change
        fetchAllWithdrawalsAndBuildBlocks(); // This will refresh the entire list; you might want a more subtle update in practice
    } catch (error) {
        console.error("Error updating withdrawal status: ", error);
    }
}



function showProfilePreview(user, date, amount, status) {
    profileContainer.innerHTML = ''; // Clear previous content
    profileContainer.style.display = 'flex'; // Make the container visible

    // Profile photo
    createDOMElement('img', 'profile-photo', user.userPhoto, profileContainer);
    
    // User's name
    createDOMElement('div', 'profile-preview-text', user.userName, profileContainer);
    
    // User's ID
    createDOMElement('div', 'profile-preview-text', `User ID: ${user.userID}`, profileContainer);
    
    // Date withdrawn
    let withdrawalDate = new Date(date.seconds * 1000).toLocaleDateString(); // Assuming 'date' is a Firestore Timestamp
    createDOMElement('div', 'profile-preview-text', `Date: ${withdrawalDate}`, profileContainer);
    
    // Amount withdrawn
    createDOMElement('div', 'profile-preview-text', `Amount: $${amount}`, profileContainer);
    
    // Status with appropriate indicator
    let statusClass = `status-${status.toLowerCase()} profile-preview-text`; // Adjust as needed for your CSS
    createDOMElement('div', statusClass, `${status}`, profileContainer);
}


fetchAllWithdrawalsAndBuildBlocks()
profileContainer.innerHTML = ''
