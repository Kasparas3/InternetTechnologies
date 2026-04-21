// main.js — runs on index.html only. Wires up the UI to the API.

// Redirect to login if we don't have a token.
if (!localStorage.getItem('token')) {
  location.href = 'login.html';
}

const listEl = document.getElementById('movie-list');
const errorEl = document.getElementById('error');
const filterEl = document.getElementById('filter');
const addForm = document.getElementById('add-form');
const editForm = document.getElementById('edit-form');
const logoutBtn = document.getElementById('logout-btn');

// Bootstrap modal instance (used to open/close the edit dialog).
const editModal = new bootstrap.Modal(document.getElementById('edit-modal'));

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove('d-none');
  setTimeout(() => errorEl.classList.add('d-none'), 4000);
}

// Escape text before inserting into HTML, so titles like <script> don't break the page.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Fetch the current list (honoring the filter) and render it.
async function loadMovies() {
  try {
    const status = filterEl.value; // "", "watched", or "to-watch"
    const query = status ? { status } : undefined;
    const movies = await api('/movies', { query });
    renderMovies(movies);
  } catch (err) {
    showError(err.message);
  }
}

// Build one Bootstrap card per movie.
function renderMovies(movies) {
  if (movies.length === 0) {
    listEl.innerHTML =
      '<div class="col-12"><div class="alert alert-info">No movies yet. Add one above!</div></div>';
    return;
  }

  listEl.innerHTML = movies
    .map(
      (m) => `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card h-100 ${m.watched ? 'border-success' : ''}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${escapeHtml(m.title)}</h5>
            <p class="card-text text-muted mb-2">
              ${escapeHtml(m.genre)} · ${m.year}
            </p>
            <div class="form-check mb-3">
              <input class="form-check-input toggle-watched" type="checkbox"
                     data-id="${m.id}" ${m.watched ? 'checked' : ''} />
              <label class="form-check-label">Watched</label>
            </div>
            <div class="mt-auto d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary edit-btn"
                      data-id="${m.id}"
                      data-title="${escapeHtml(m.title)}"
                      data-genre="${escapeHtml(m.genre)}"
                      data-year="${m.year}">Edit</button>
              <button class="btn btn-sm btn-outline-danger delete-btn"
                      data-id="${m.id}">Delete</button>
            </div>
          </div>
        </div>
      </div>`
    )
    .join('');
}

// Event delegation: one listener on the list container handles all buttons.
listEl.addEventListener('click', async (event) => {
  const target = event.target;
  const id = target.dataset.id;
  if (!id) return;

  try {
    if (target.classList.contains('delete-btn')) {
      if (!confirm('Delete this movie?')) return;
      await api(`/movies/${id}`, { method: 'DELETE' });
      await loadMovies();
    } else if (target.classList.contains('toggle-watched')) {
      await api(`/movies/${id}/status`, {
        method: 'PATCH',
        body: { watched: target.checked },
      });
      await loadMovies();
    } else if (target.classList.contains('edit-btn')) {
      // Pre-fill the edit modal from the button's data-* attributes.
      document.getElementById('edit-id').value = id;
      document.getElementById('edit-title').value = target.dataset.title;
      document.getElementById('edit-genre').value = target.dataset.genre;
      document.getElementById('edit-year').value = target.dataset.year;
      editModal.show();
    }
  } catch (err) {
    showError(err.message);
  }
});

// Add form → POST /api/movies
addForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/movies', {
      method: 'POST',
      body: {
        title: document.getElementById('add-title').value,
        genre: document.getElementById('add-genre').value,
        year: Number(document.getElementById('add-year').value),
      },
    });
    addForm.reset();
    await loadMovies();
  } catch (err) {
    showError(err.message);
  }
});

// Edit form → PUT /api/movies/:id
editForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.getElementById('edit-id').value;
  try {
    await api(`/movies/${id}`, {
      method: 'PUT',
      body: {
        title: document.getElementById('edit-title').value,
        genre: document.getElementById('edit-genre').value,
        year: Number(document.getElementById('edit-year').value),
      },
    });
    editModal.hide();
    await loadMovies();
  } catch (err) {
    showError(err.message);
  }
});

// Filter dropdown → reload list with ?status=...
filterEl.addEventListener('change', loadMovies);

// Logout → clear token and go back to login page.
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  location.href = 'login.html';
});

// Initial load.
loadMovies();
