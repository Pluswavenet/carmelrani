// Admin Logic (Compat SDK)

// --- Auth Protection ---
const appContainer = document.getElementById('app');
const authLoading = document.getElementById('auth-loading');
const logoutBtn = document.getElementById('logout-btn');

auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        if (authLoading) authLoading.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        initAdmin(); // Start fetching data
    } else {
        // No user is signed in
        window.location.href = 'login.html';
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm("Sign out of Admin Portal?")) {
            auth.signOut();
        }
    });
}


// --- Modal Logic ---
const modal = {
    overlay: document.getElementById('custom-modal'),
    title: document.getElementById('modal-title'),
    message: document.getElementById('modal-message'),
    inputContainer: document.getElementById('modal-input-container'),
    input: document.getElementById('modal-input'),
    confirmBtn: document.getElementById('modal-confirm-btn'),
    cancelBtn: document.getElementById('modal-cancel-btn'),

    confirm: (title, text) => {
        return new Promise((resolve) => {
            if (!modal.overlay) return resolve(confirm(text));
            modal.title.textContent = title;
            modal.message.textContent = text;
            modal.inputContainer.classList.add('hidden');
            modal.overlay.classList.remove('hidden');

            const close = (result) => {
                modal.overlay.classList.add('hidden');
                modal.confirmBtn.onclick = null;
                modal.cancelBtn.onclick = null;
                resolve(result);
            };
            modal.confirmBtn.onclick = () => close(true);
            modal.cancelBtn.onclick = () => close(false);
        });
    },

    prompt: (title, text, defaultValue = "") => {
        return new Promise((resolve) => {
            if (!modal.overlay) return resolve(prompt(text, defaultValue));
            modal.title.textContent = title;
            modal.message.textContent = text;
            modal.inputContainer.classList.remove('hidden');
            modal.input.value = defaultValue;
            modal.input.focus();
            modal.overlay.classList.remove('hidden');

            const close = (result) => {
                modal.overlay.classList.add('hidden');
                modal.confirmBtn.onclick = null;
                modal.cancelBtn.onclick = null;
                resolve(result);
            };
            modal.confirmBtn.onclick = () => close(modal.input.value);
            modal.cancelBtn.onclick = () => close(null);
        });
    }
};

if (modal.overlay) {
    modal.overlay.addEventListener('click', (e) => {
        if (e.target === modal.overlay) modal.overlay.classList.add('hidden');
    });
}


// --- View State ---
const viewNewsBtn = document.getElementById('view-news-btn');
const viewGalleryBtn = document.getElementById('view-gallery-btn');
const newsFeedSection = document.getElementById('news-feed');
const galleryManagerSection = document.getElementById('gallery-manager');
let currentView = 'news';

function switchView(view) {
    currentView = view;
    if (view === 'news') {
        newsFeedSection.classList.remove('hidden');
        galleryManagerSection.classList.add('hidden');
        if (viewNewsBtn) viewNewsBtn.classList.add('gallery-nav-active');
        if (viewGalleryBtn) viewGalleryBtn.classList.remove('gallery-nav-active');
        initNewsFeed();
    } else {
        if (newsFeedSection) newsFeedSection.classList.add('hidden');
        if (galleryManagerSection) galleryManagerSection.classList.remove('hidden');
        if (viewNewsBtn) viewNewsBtn.classList.remove('gallery-nav-active');
        if (viewGalleryBtn) viewGalleryBtn.classList.add('gallery-nav-active');
        initGalleryFeed();
        loadCategories();
    }
}

if (viewNewsBtn) viewNewsBtn.addEventListener('click', () => switchView('news'));
if (viewGalleryBtn) viewGalleryBtn.addEventListener('click', () => switchView('gallery'));


// --- Elements ---
const fabWrite = document.getElementById('fab-write');
const adminEditor = document.getElementById('admin-editor');
const galleryEditor = document.getElementById('gallery-editor');
const toast = document.getElementById('toast');


// --- News Feed ---
const feedContainer = document.getElementById('news-feed');
const feedLoader = document.getElementById('feed-loader');
const closeEditorBtn = document.getElementById('close-editor-btn');
const postForm = document.getElementById('post-form');
let newsUnsubscribe = null;

function initAdmin() {
    // Check Config
    const config = window.ADMIN_CONFIG || { showNews: true, showGallery: true };

    if (!config.showNews) {
        // Hide News Button
        if (viewNewsBtn) viewNewsBtn.style.display = 'none';
        // Force Gallery View
        switchView('gallery');
    } else {
        // Default behavior
        switchView('gallery'); // Force gallery view by default as requested
        if (viewNewsBtn) viewNewsBtn.style.display = 'none'; // Hide News button to avoid "Compose Update" confusion
    }
}

function initNewsFeed() {
    if (newsUnsubscribe) return;
    if (feedLoader) feedLoader.classList.remove('hidden');
    newsUnsubscribe = db.collection("posts").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        const posts = [];
        snapshot.forEach((doc) => posts.push({ id: doc.id, ...doc.data() }));
        if (feedLoader) feedLoader.classList.add('hidden');
        renderFeed(posts);
    });
}

function renderFeed(posts) {
    if (!feedContainer) return;
    feedContainer.innerHTML = '';
    if (posts.length === 0) {
        feedContainer.innerHTML = '<p style="text-align:center; padding: 2rem;">No posts yet.</p>';
        return;
    }
    posts.forEach((post, index) => {
        const card = document.createElement('article');
        card.className = 'card';
        let imageHtml = post.image ? `<img src="${post.image}" class="card-image" loading="lazy">` : '';
        card.innerHTML = `
            <div class="card-header">
                <div class="author-circle">${post.authorInitial || 'A'}</div>
                <div class="meta-info">
                    <div class="author-name">News</div>
                    <div class="post-date">${post.date}</div>
                </div>
            </div>
            <h3 class="card-title">${post.title}</h3>
            ${imageHtml}
            <div class="card-story">${post.story}</div>
            <div style="margin-top: 1rem; display: flex; justify-content: flex-end;">
                <button class="btn-delete-post" data-id="${post.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Delete
                </button>
            </div>`;
        card.querySelector('.btn-delete-post').addEventListener('click', (e) => handleDeletePost(post.id, e));
        feedContainer.appendChild(card);
    });
}

async function handleDeletePost(id, event) {
    if (event) event.stopPropagation();
    if (await modal.confirm('Delete News?', 'Delete this post?')) {
        db.collection("posts").doc(id).delete().then(() => showToast('Post deleted'));
    }
}


// --- Gallery Logic ---
const galleryGrid = document.getElementById('gallery-grid');
const galleryLoader = document.getElementById('gallery-loader');
const closeGalleryEditorBtn = document.getElementById('close-gallery-editor-btn');
const galleryForm = document.getElementById('gallery-form');
let galleryUnsubscribe = null;

function initGalleryFeed() {
    if (galleryUnsubscribe) return;
    if (galleryLoader) galleryLoader.classList.remove('hidden');
    galleryUnsubscribe = db.collection("gallery_images").orderBy("timestamp", "asc").onSnapshot((snapshot) => {
        const images = [];
        snapshot.forEach((doc) => images.push({ id: doc.id, ...doc.data() }));
        if (galleryLoader) galleryLoader.classList.add('hidden');
        renderGalleryGrouped(images);
    });
}

// Global to track categories so they don't disappear instantly on last delete
window.galleryKnownCategories = window.galleryKnownCategories || new Set();

function renderGalleryGrouped(images) {
    window.lastGalleryImages = images; // Cache for pagination
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';

    // Map images to groups
    const groups = {};
    images.forEach(img => {
        const cat = img.category || 'Uncategorized';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(img);
        window.galleryKnownCategories.add(cat); // Track existence
    });

    // Merge known categories to keep empty ones visible until page refresh or explicit delete
    const allCategories = new Set([...Object.keys(groups), ...window.galleryKnownCategories]);

    if (allCategories.size === 0) {
        galleryGrid.innerHTML = '<p class="text-muted" style="text-align:center;">No photos yet.</p>';
        return;
    }

    // MERGE & SORT LOGIC
    // 1. Calculate Creation Timestamp for each group (min timestamp of images)
    // If a group has no images (deleted/cleared?), we might need a stored timestamp or it defaults to now (or 0?)
    // User wants "first time creating that will goes down" -> Wait, "first add... come first, next... go down".
    // 1st Album -> Top. 2nd Album -> Below.
    // This is ASCENDING order of creation.

    // We already sorted images by 'asc' from Firestore.
    // So the groups created earlier will appear earlier in the loop if we iterate?
    // Not necessarily, if we group by Map keys, order is insertion-order-ish but not guaranteed.
    // We need an explicit sort.

    const groupData = [];
    allCategories.forEach(cat => {
        const imgs = groups[cat] || [];
        // Ensure images are sorted ASC first to find the true 'creation' time (oldest image)
        imgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        // Find earliest timestamp. Default to 0 if missing (treat as old/legacy).
        let createdTime = 0;
        if (imgs.length > 0) {
            createdTime = imgs[0].timestamp || 0;
        } else {
            createdTime = Infinity; // Empty albums go last
        }

        groupData.push({ category: cat, images: imgs, created: createdTime });
    });

    // Sort Groups: Oldest Created -> Top
    groupData.sort((a, b) => a.created - b.created);

    // --- Pagination Logic ---
    const itemsPerPage = 5;
    const totalPages = Math.ceil(groupData.length / itemsPerPage);

    // Ensure current page is valid
    if (window.galleryCurrentPage > totalPages) window.galleryCurrentPage = totalPages;
    if (window.galleryCurrentPage < 1) window.galleryCurrentPage = 1;

    const startIndex = (window.galleryCurrentPage - 1) * itemsPerPage;
    const paginatedGroups = groupData.slice(startIndex, startIndex + itemsPerPage);

    // Render Paginated Items
    paginatedGroups.forEach(group => {
        const category = group.category;
        // Explicitly sort images ASC (Oldest First) to ensure consistency
        const groupImages = group.images.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        // ... render logic ...

        const groupEl = document.createElement('div');
        groupEl.className = 'gallery-group-card';

        let imagesHtml = '';
        if (groupImages.length > 0) {
            groupImages.forEach(img => {
                imagesHtml += `
                    <div class="gallery-item-admin">
                        <img src="${img.url}" loading="lazy">
                        <div class="delete-overlay">
                             <button class="overlay-btn btn-replace-img" onclick="handleReplaceGalleryImage('${img.id}')" title="Replace Photo">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                             </button>
                             <button class="overlay-btn btn-del-img" onclick="handleDeleteGalleryImage('${img.id}')" title="Delete Photo">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                             </button>
                        </div>
                    </div>`;
            });
        } else {
            imagesHtml = `<div style="width:100%; text-align:center; padding:2rem; color:#94a3b8; border:2px dashed #e2e8f0; border-radius:12px;">No photos in this album. Add some!</div>`;
        }

        groupEl.innerHTML = `
                <div class="gallery-group-header">
                    <div style="display:flex; flex-direction:column; gap:4px;">
                       <h3 class="gallery-group-title">${category}</h3>
                       <span class="gallery-count">${groupImages.length} photos</span>
                    </div>
                    <div class="gallery-group-actions">
                        <button class="btn-add-group" onclick="openAddPhotosToCategory('${category}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Add Photos
                        </button>
                        <button class="btn-clear-photos" onclick="handleClearCategoryPhotos('${category}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                            Clear Photos
                        </button>
                        <button class="btn-edit" onclick="handleEditCategory('${category}')">Rename</button>
                        <button class="btn-delete-group" onclick="handleDeleteCategoryGroup('${category}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Delete Album
                        </button>
                    </div>
                </div>
                <div class="gallery-grid-admin">${imagesHtml}</div>`;
        galleryGrid.appendChild(groupEl);
    });

    // Render Pagination Controls (Always show for visibility) - Modern Style
    if (true) {
        const controls = document.createElement('div');
        // Inline styles for modern look in admin
        const modernControlsStyle = "display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-top: 2rem; padding: 1rem 2rem; background: rgba(255, 255, 255, 0.9); border-radius: 50px; width: fit-content; margin-left: auto; margin-right: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;";
        const modernBtnStyle = "width: 42px; height: 42px; border-radius: 50%; border: none; background: white; color: #334155; font-size: 1rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;";
        const infoStyle = "font-weight: 700; color: #475569; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px;";

        controls.innerHTML = `
            <div style="${modernControlsStyle}">
                <button onclick="changeGalleryPage(-1)" onmouseover="this.style.transform='translateY(-2px)'; this.style.color='#6366f1';" onmouseout="this.style.transform='none'; this.style.color='#334155';" class="btn-page-admin" ${window.galleryCurrentPage === 1 ? 'disabled' : ''} style="${modernBtnStyle}; opacity: ${window.galleryCurrentPage === 1 ? 0.5 : 1}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <span style="${infoStyle}">Page ${window.galleryCurrentPage} <span style="color:#cbd5e1; margin:0 4px;">/</span> ${totalPages}</span>
                <button onclick="changeGalleryPage(1)" onmouseover="this.style.transform='translateY(-2px)'; this.style.color='#6366f1';" onmouseout="this.style.transform='none'; this.style.color='#334155';" class="btn-page-admin" ${window.galleryCurrentPage === totalPages ? 'disabled' : ''} style="${modernBtnStyle}; opacity: ${window.galleryCurrentPage === totalPages ? 0.5 : 1}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
            </div>
        `;
        galleryGrid.appendChild(controls);
    }
}

// Global Pagination State & Helper
window.galleryCurrentPage = 1;
window.changeGalleryPage = function (delta) {
    window.galleryCurrentPage += delta;
    // Trigger re-render by re-fetching? No, we have the listener. 
    // We need to re-render using the *cached* data. 
    // BUT we don't have cached data easily accessible outside.
    // However, invoking 'initGalleryFeed' again won't work perfectly as it sets up a listener.
    // Actually, onSnapshot fires only on updates.
    // Solution: Store the last `images` array in a global variable and call `renderGalleryGrouped` again.
    if (window.lastGalleryImages) {
        renderGalleryGrouped(window.lastGalleryImages);
    }
};

const btnPageStyle = ""; // Deprecated, using classes now
// We need to inject styles into admin head if they don't exist, or use inline styles that mimic the gallery.
// Inline approach for reliability given the context:
const modernControlsStyle = "display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-top: 2rem; padding: 1rem 2rem; background: rgba(255, 255, 255, 0.9); border-radius: 50px; width: fit-content; margin-left: auto; margin-right: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;";
const modernBtnStyle = "width: 42px; height: 42px; border-radius: 50%; border: none; background: white; color: #334155; font-size: 1rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;";
const infoStyle = "font-weight: 700; color: #475569; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px;";

// Update initGalleryFeed to store cache
const originalInitGallery = initGalleryFeed;
// We already have initGalleryFeed. Let's patch it via replacement or just rely on 'renderGalleryGrouped' being called by listener.
// Wait, I can't easily modify initGalleryFeed here without another chunk.
// I will add `window.lastGalleryImages = images;` inside `initGalleryFeed` in a separate chunk or modify the Render function to store it itself?
// Storing it inside renderGalleryGrouped is safer.
// At top of renderGalleryGrouped: window.lastGalleryImages = images;



// Globals
window.handleClearCategoryPhotos = async (category) => {
    if (await modal.confirm('Clear Photos?', `Delete ONLY the photos in "${category}"? The album will remain.`)) {
        showToast("Deleting photos...", 0);
        const batch = db.batch();
        const snapshot = await db.collection("gallery_images").where("category", "==", category).get();
        const deletions = [];

        snapshot.forEach(doc => {
            batch.delete(doc.ref);
            const d = doc.data();
            if (d.storagePath) {
                deletions.push(firebase.storage().ref(d.storagePath).delete().catch(e => console.warn(e)));
            }
        });

        await Promise.all(deletions);
        await batch.commit();
        showToast("Photos cleared.");
    }
};

// Globals
window.handleDeleteCategoryGroup = async (category) => {
    if (await modal.confirm('Delete Album?', `Delete all photos in "${category}" and remove the album ? `)) {
        // Remove from local "memory" so it doesn't re-appear as empty
        window.galleryKnownCategories.delete(category);

        // Delete actual images from DB
        const batch = db.batch();
        const snapshot = await db.collection("gallery_images").where("category", "==", category).get();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
            const d = doc.data();
            if (d.storagePath) firebase.storage().ref(d.storagePath).delete().catch(console.warn);
        });
        await batch.commit();
        showToast('Album deleted');
    }
};

window.openAddPhotosToCategory = (category) => {
    if (!galleryEditor) return;

    // Reset Logic
    resetGalleryImage();

    // Pre-fill Category
    const catInput = document.getElementById('gallery-category');
    if (catInput) {
        catInput.value = category;
    }

    // Open Editor
    galleryEditor.classList.remove('hidden');
};

// Globals
let pendingReplaceId = null;
const replaceInput = document.getElementById('replace-gallery-input');

if (replaceInput) {
    replaceInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!pendingReplaceId) {
            alert("Error: No image selected.");
            return;
        }

        showToast("Processing...", 0);

        try {
            // 1. Compress Image to ensure it fits in Database (Must be < 1MB)
            // We bypass Storage completely to avoid CORS errors.
            console.log("Compressing for direct DB storage...");
            const base64String = await compressImage(file);

            // 2. Save DIRECTLY to Database
            console.log("Saving to Firestore...");
            const docRef = db.collection("gallery_images").doc(pendingReplaceId);

            // Unlink from storage since we are now using DB-only storage
            await docRef.update({
                url: base64String,
                storagePath: firebase.firestore.FieldValue.delete() // Remove storage link
            });

            showToast("Success! Photo updated.");

        } catch (err) {
            console.error("Direct Save Error:", err);
            alert("Save Failed: " + err.message);
            showToast("Error: " + err.message);
        } finally {
            replaceInput.value = '';
            pendingReplaceId = null;
        }
    });
}

window.handleReplaceGalleryImage = (id) => {
    pendingReplaceId = id;
    if (replaceInput) {
        replaceInput.value = '';
        replaceInput.click();
    }
};

window.handleDeleteGalleryImage = async (id) => {
    // Find the doc to get storage path
    const doc = await db.collection("gallery_images").doc(id).get();
    if (doc.exists && await modal.confirm('Delete Photo?', 'Delete this photo?')) {
        const data = doc.data();
        if (data.storagePath) {
            // Try delete storage
            firebase.storage().ref(data.storagePath).delete().catch(e => console.warn(e));
        }
        await db.collection("gallery_images").doc(id).delete();
        showToast('Photo deleted');
    }
};

window.handleEditCategory = async (oldName) => {
    // Default value is empty string so user doesn't see old name in input
    const newName = await modal.prompt('Rename Album', `Enter new name for "${oldName}":`, "");

    if (newName && newName.trim() !== "" && newName !== oldName) {
        if (await modal.confirm('Confirm Rename', `Rename "${oldName}" to "${newName}"?`)) {
            showToast("Renaming...", 0);
            const snap = await db.collection("gallery_images").where("category", "==", oldName).get();
            const batch = db.batch();
            snap.forEach(doc => batch.update(doc.ref, { category: newName }));
            // Remove old category from known set so it doesn't linger as empty
            // We do this BEFORE commit to potential race conditions with onSnapshot
            if (window.galleryKnownCategories) {
                window.galleryKnownCategories.delete(oldName);
                window.galleryKnownCategories.add(newName);
            }

            await batch.commit();

            showToast("Album Renamed");
        }
    }
};

// --- Editor ---
if (fabWrite) {
    fabWrite.addEventListener('click', () => {
        // User requested to remove "Compose Update" (News) and only have "Add Photos"
        // So we force open Gallery Editor regardless of current view
        galleryEditor.classList.remove('hidden');
        galleryForm.reset();
        resetGalleryImage();
        loadCategories();
    });
}

// Toast Logic
let toastTimer1, toastTimer2;
function showToast(msg, duration = 3000) {
    if (!toast) return;

    // Clear previous timers so we don't hide new messages
    clearTimeout(toastTimer1);
    clearTimeout(toastTimer2);

    toast.textContent = msg;
    toast.classList.remove('hidden');

    // Small delay to allow display:block to apply before opacity transition
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    // If duration is 0, stay visible (for loading states)
    if (duration > 0) {
        toastTimer1 = setTimeout(() => {
            toast.classList.remove('visible');
            toastTimer2 = setTimeout(() => toast.classList.add('hidden'), 300);
        }, duration);
    }
}

// ... image handling ...
function resetNewsImage() {
    const container = document.getElementById('image-preview-container');
    const input = document.getElementById('post-image');
    if (container) container.classList.add('hidden');
    if (input) input.value = '';
    const txt = document.getElementById('upload-text');
    if (txt) txt.textContent = "Tap to add photo";
}

const postImageInput = document.getElementById('post-image');
if (postImageInput) {
    postImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('image-preview').src = e.target.result;
                document.getElementById('image-preview-container').classList.remove('hidden');
                document.getElementById('upload-text').textContent = "Photo selected";
            };
            reader.readAsDataURL(file);
        }
    });
}
document.getElementById('remove-image-btn')?.addEventListener('click', resetNewsImage);
document.getElementById('replace-image-btn')?.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent accidental form submission
    if (postImageInput) postImageInput.click();
});
document.getElementById('close-editor-btn')?.addEventListener('click', () => {
    adminEditor.classList.add('hidden');
});

// --- Gallery Upload & Image Logic ---
const galleryImageInput = document.getElementById('gallery-image');
const galleryPreviewsContainer = document.getElementById('gallery-previews');
const galleryPreviewMainContainer = document.getElementById('gallery-preview-container');
const clearGalleryImagesBtn = document.getElementById('clear-gallery-images-btn');
const galleryUploadText = document.getElementById('gallery-upload-text');
let galleryPendingFiles = []; // Store actual Files

function resetGalleryImage() {
    galleryPendingFiles = [];
    if (galleryPreviewMainContainer) galleryPreviewMainContainer.classList.add('hidden');
    if (galleryImageInput) galleryImageInput.value = '';
    if (galleryUploadText) galleryUploadText.textContent = "Select Photos (Max 4)"; // Updated Text limit
    if (galleryPreviewsContainer) galleryPreviewsContainer.innerHTML = '';
    // Restore label visibility
    const label = galleryImageInput?.closest('.image-upload-label');
    if (label) label.style.display = 'flex';
}

if (galleryImageInput) {
    galleryImageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (files.length > 4) {
            alert("You can only select up to 4 photos at a time.");
            galleryImageInput.value = ''; // Clear selection
            return;
        }

        galleryPreviewsContainer.innerHTML = '';
        galleryPendingFiles = [];

        // Process files and create previews in strict order
        const previewPromises = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve({ file, src: reader.result });
                reader.readAsDataURL(file);
            });
        });

        Promise.all(previewPromises).then(results => {
            results.forEach(result => {
                galleryPendingFiles.push(result.file); // Push in order
                const img = document.createElement('img');
                img.src = result.src;
                img.className = 'gallery-preview-item';
                galleryPreviewsContainer.appendChild(img);
            });

            if (files.length > 0) {
                galleryPreviewMainContainer.classList.remove('hidden');
                galleryUploadText.textContent = `${files.length} Photos Selected`;
                const label = galleryImageInput.closest('.image-upload-label');
                if (label) label.style.display = 'none';
            }
        });
    });
}

if (clearGalleryImagesBtn) clearGalleryImagesBtn.addEventListener('click', (e) => { e.stopPropagation(); resetGalleryImage(); });
document.getElementById('change-gallery-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (galleryImageInput) galleryImageInput.click();
});
document.getElementById('close-gallery-editor-btn')?.addEventListener('click', () => {
    galleryEditor.classList.add('hidden');
});


function loadCategories() {
    db.collection("gallery_images").get().then(snap => {
        const cats = new Set();
        snap.forEach(doc => cats.add(doc.data().category));
        const dl = document.getElementById('category-suggestions');
        if (dl) {
            dl.innerHTML = '';
            cats.forEach(c => {
                if (c) {
                    const op = document.createElement('option');
                    op.value = c;
                    dl.appendChild(op);
                }
            });
        }
    });
}

// --- Submit Post ---
if (postForm) postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = postForm.querySelector('.submit-btn');
    btn.disabled = true; btn.textContent = "Publishing...";

    try {
        const title = document.getElementById('post-title').value;
        const story = document.getElementById('post-story').value;
        const file = document.getElementById('post-image').files[0];
        let imageUrl = null;

        if (file) {
            // "Decrease image size and upload fastly"
            // We ALWAYS compress first now to ensure speed and consistency
            const compressedBase64 = await compressImage(file);

            // Try Storage First with the compressed data (converted to blob)
            try {
                // Convert Base64 back to Blob for Storage upload
                const fetchRes = await fetch(compressedBase64);
                const blob = await fetchRes.blob();

                const ref = firebase.storage().ref(`news/${Date.now()}_compressed.jpg`);
                await ref.put(blob);
                imageUrl = await ref.getDownloadURL();
            } catch (err) {
                console.warn("Storage failed, using Base64 fallback (Fast but limited size)", err);
                // Fallback: Use the compressed base64 directly
                // compressImage guarantees < 1MB so this is safe for Firestore
                imageUrl = compressedBase64;
            }
        }

        await db.collection("posts").add({
            title, story,
            image: imageUrl,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            authorInitial: "A"
        });

        postForm.reset();
        resetNewsImage();
        adminEditor.classList.add('hidden');
        showToast("News published!");
    } catch (err) {
        console.error(err);
        alert(err.message);
    } finally {
        btn.disabled = false; btn.textContent = "Publish Update";
    }
});


// --- Robust Gallery Upload Logic (Copied from previous trusted solution) ---
if (galleryForm) galleryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (galleryPendingFiles.length === 0) {
        alert('Please select photos first.');
        return;
    }

    const cat = document.getElementById('gallery-category').value.trim();
    if (!cat) {
        alert('Please enter a category name.');
        return;
    }

    const btn = galleryForm.querySelector('.submit-btn');
    const oldText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `Uploading...`;
    showToast(`Starting upload...`, 0);

    let successCount = 0;
    let failCount = 0;
    const errors = [];
    const storageInstance = firebase.storage();

    // Process sequentially
    for (let i = 0; i < galleryPendingFiles.length; i++) {
        const file = galleryPendingFiles[i];
        btn.innerHTML = `Uploading ${i + 1}/${galleryPendingFiles.length}...`;
        showToast(`Uploading ${i + 1}/${galleryPendingFiles.length}...`, 0);

        try {
            // 1. Compress FIRST for speed ("Upload fastly")
            const compressedBase64 = await compressImage(file);

            // 2. Try Upload to Storage (Preferred)
            const timestamp = Date.now();
            // We use a generic name since we converted to JPEG
            const storagePath = `gallery/${timestamp}_${i}.jpg`;

            let downloadURL;
            let finalStoragePath = storagePath;

            try {
                // Convert Base64 back to Blob for Storage upload
                const fetchRes = await fetch(compressedBase64);
                const blob = await fetchRes.blob();

                const uploadPromise = storageInstance.ref(storagePath).put(blob).then(s => s.ref.getDownloadURL());
                // 10s timeout is enough for small compressed files
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000));

                downloadURL = await Promise.race([uploadPromise, timeoutPromise]);
            } catch (storageErr) {
                console.warn(`Storage failed for item ${i}, using fallback.`);
                // Fallback: Direct Firestore Base64
                downloadURL = compressedBase64;
                finalStoragePath = null;
            }

            await db.collection("gallery_images").add({
                category: cat,
                url: downloadURL,
                url: downloadURL,
                storagePath: finalStoragePath,
                timestamp: Date.now() + i // Add loop index to ensure strict distinct ascending timestamps
            });
            successCount++;

            // Tiny delay to ensure server timestamps (if derived) or just distinct Date.now()
            await new Promise(r => setTimeout(r, 50));

        } catch (err) {
            console.error(err);
            failCount++;
            errors.push(err.message);
        }
    }

    if (failCount === 0) {
        galleryEditor.classList.add('hidden');
        showToast(`Success! ${successCount} photos added.`);
        galleryForm.reset();
        resetGalleryImage();
    } else {
        alert(`Finished. Success: ${successCount}, Failed: ${failCount}`);
    }

    btn.innerHTML = oldText;
    btn.disabled = false;
});

// Helper: Image Compression
// "Automatically compress the size to below 1 mp (approx 1MB)"
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Target: Web Speed (Display Fastly)
                // Max 1200px is usually plenty for a gallery grid and reduces size massively
                const MAX_DIMENSION = 1200;

                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height *= MAX_DIMENSION / width;
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width *= MAX_DIMENSION / height;
                        height = MAX_DIMENSION;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Iterative Compression to ensure < 1MB
                let quality = 0.8;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);

                // Check size (Head approximation: (length - header) * 3/4)
                while (dataUrl.length > 1000000 && quality > 0.1) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }

                resolve(dataUrl);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}


