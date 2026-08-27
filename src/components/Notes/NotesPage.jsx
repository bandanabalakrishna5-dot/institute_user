import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Form, Spinner } from 'react-bootstrap';
import {
  FaArrowLeft,
  FaCloudUploadAlt,
  FaDownload,
  FaEdit,
  FaFileAlt,
  FaPlus,
  FaStickyNote,
  FaTimes,
  FaTrash,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import { fetchBranchClasses, fetchClassSections } from '../../services/HomeworkServices/homeworkServices';
import {
  createNotes,
  deleteNotes,
  fetchNotes,
  updateNotes,
  uploadNoteAttachment,
} from '../../services/NotesServices/notesServices';
import CustomSelect from '../common/CustomSelect';
import Layout from '../common/Layout';
import SectionSelect from '../common/SectionSelect';

const emptyAlert = { show: false, message: '', variant: 'danger' };
const fileNameFromUrl = (url = '') => {
  try { return decodeURIComponent(String(url).split('/').pop().split('?')[0]) || 'Note attachment'; }
  catch (error) { return 'Note attachment'; }
};

function NotesPage() {
  const { stateAuth } = useContext(AuthContext);
  const user = stateAuth?.user || {};
  const userType = String(user.typ || '').toUpperCase();
  const isStaff = userType === 'STAFF';
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(emptyAlert);

  const showAlert = (message, variant = 'danger') => setAlert({ show: true, message, variant });

  const loadNotes = useCallback(async () => {
    if (!user.instid || !user.brcid || !user.acdmcyr) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetchNotes({
        instid: user.instid,
        brcid: user.brcid,
        acdmcyr: user.acdmcyr,
        typ: userType,
        ...(userType === 'STUDENT' ? { clsid: user.clsid, secid: user.secid } : {}),
      });
      setNotes(response?.status === 'success' && Array.isArray(response.payload) ? response.payload : []);
    } catch (error) {
      setNotes([]);
      showAlert('Unable to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user.acdmcyr, user.brcid, user.clsid, user.instid, user.secid, userType]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  useEffect(() => {
    if (!isStaff || !user.brcid || !user.acdmcyr) return;
    fetchBranchClasses({ brcid: user.brcid, acdmcyr: user.acdmcyr })
      .then((response) => setClasses(response?.status === 'success' && Array.isArray(response.payload) ? response.payload : []))
      .catch(() => setClasses([]));
  }, [isStaff, user.acdmcyr, user.brcid]);

  const handleClassChange = async (value) => {
    setClassId(value);
    setSectionId('');
    setSections([]);
    if (!value) return;
    try {
      const response = await fetchClassSections({ clsid: value });
      setSections(response?.status === 'success' && Array.isArray(response.payload) ? response.payload : []);
    } catch (error) { setSections([]); }
  };

  const resetComposer = () => {
    setClassId('');
    setSectionId('');
    setSections([]);
    setAttachments([]);
    setEditingId(null);
    setShowComposer(false);
  };

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type))) {
      showAlert('Select only JPG, PNG, WebP, or PDF files.');
      return;
    }
    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      showAlert('Each attachment must be smaller than 10 MB.');
      return;
    }
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const response = await uploadNoteAttachment(file);
        const url = response?.payload?.url || response?.url || '';
        if (response?.status !== 'success' || !url) throw new Error('Upload failed');
        uploaded.push({ url, name: file.name });
      }
      setAttachments((current) => [...current, ...uploaded]);
    } catch (error) {
      showAlert('Unable to upload one or more attachments.');
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!classId || !sectionId || !attachments.length) {
      showAlert('Class, section, and at least one attachment are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ntid: editingId,
        fkinstid: user.instid,
        fkbrcid: user.brcid,
        clsid: classId,
        secid: sectionId,
        acdmcyr: user.acdmcyr,
        usrid: user.usrid,
        urls: attachments.map(({ nturlid, url }) => ({ nturlid, url })),
      };
      const response = editingId ? await updateNotes(payload) : await createNotes(payload);
      if (response?.status !== 'success') throw new Error(response?.error?.message || 'Save failed');
      resetComposer();
      showAlert(editingId ? 'Notes updated successfully.' : 'Notes created successfully.', 'success');
      await loadNotes();
    } catch (error) {
      showAlert(error.message || 'Unable to save notes.');
    } finally { setSaving(false); }
  };

  const handleEdit = async (note) => {
    setEditingId(note.ntid);
    setClassId(note.clsid);
    setAttachments((note.urls || []).map((item) => ({ ...item, name: fileNameFromUrl(item.url) })));
    setShowComposer(true);
    try {
      const response = await fetchClassSections({ clsid: note.clsid });
      setSections(response?.status === 'success' && Array.isArray(response.payload) ? response.payload : []);
      setSectionId(note.secid);
    } catch (error) { setSectionId(note.secid); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (note) => {
    if (!window.confirm(`Delete notes for ${note.clsnm || 'this class'}?`)) return;
    try {
      const response = await deleteNotes(note.ntid);
      if (response?.status !== 'success') throw new Error('Delete failed');
      showAlert('Notes deleted successfully.', 'success');
      await loadNotes();
    } catch (error) { showAlert('Unable to delete notes.'); }
  };

  return (
    <Layout>
      <div className="hw-page notes-page">
        <div className="hw-shell">
          <div className="hw-mobile-header">
            <button type="button" className="hw-icon-btn" onClick={() => navigate('/dashboard')} aria-label="Go back"><FaArrowLeft /></button>
            <div className="hw-header-copy">
              <span className="hw-kicker">Notes</span>
              <h1>{showComposer ? (editingId ? 'Edit Notes' : 'Create Notes') : 'Class Notes'}</h1>
              <p>{isStaff ? 'Share class notes and learning material.' : 'View notes shared for your class.'}</p>
            </div>
            {isStaff && !showComposer && <button type="button" className="hw-primary-btn notes-add-btn" onClick={() => setShowComposer(true)}><FaPlus /> Add</button>}
          </div>

          {alert.show && <Alert variant={alert.variant} dismissible onClose={() => setAlert(emptyAlert)}>{alert.message}</Alert>}

          {isStaff && showComposer && (
            <section className="hw-composer-card">
              <div className="hw-composer-head"><div><span className="hw-kicker">{editingId ? 'Update notes' : 'New notes'}</span><h2>{editingId ? 'Edit class notes' : 'Create class notes'}</h2></div></div>
              <Form className="hw-form-grid">
                <Form.Group><Form.Label>Class <span className="text-danger">*</span></Form.Label><CustomSelect options={classes.map((item) => ({ value: item.clsid, label: item.clsnm }))} value={classId} onChange={handleClassChange} placeholder="Select class" ariaLabel="Class" /></Form.Group>
                <Form.Group><Form.Label>Section <span className="text-danger">*</span></Form.Label><SectionSelect sections={sections} value={sectionId} onChange={setSectionId} disabled={!classId} /></Form.Group>
                <Form.Group className="hw-form-grid-full">
                  <Form.Label>Attachments <span className="text-danger">*</span></Form.Label>
                  <label className={`hw-upload-dropzone ${uploading ? 'is-uploading' : ''}`}>
                    <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFiles} disabled={uploading || saving} />
                    <span className="hw-upload-icon">{uploading ? <Spinner animation="border" size="sm" /> : <FaCloudUploadAlt />}</span>
                    <span className="hw-upload-copy"><strong>{uploading ? 'Uploading...' : 'Upload notes'}</strong><small>JPG, PNG, WebP or PDF · Max 10 MB each</small></span>
                  </label>
                </Form.Group>
              </Form>
              {!!attachments.length && <div className="notes-attachment-list">{attachments.map((item, index) => <div className="notes-attachment-item" key={item.nturlid || item.url}><FaFileAlt /><span>{item.name || fileNameFromUrl(item.url)}</span><button type="button" onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove attachment"><FaTimes /></button></div>)}</div>}
              <div className="hw-submit-bar"><button type="button" className="hw-secondary-btn" onClick={resetComposer}>Cancel</button><button type="button" className="hw-primary-btn" onClick={handleSave} disabled={saving || uploading}>{saving ? <><Spinner animation="border" size="sm" /> Saving...</> : editingId ? 'Update notes' : 'Publish notes'}</button></div>
            </section>
          )}

          {!showComposer && <section className="hw-feed-section">
            <div className="hw-feed-toolbar"><div><span className="hw-kicker">{notes.length} {notes.length === 1 ? 'note set' : 'note sets'}</span><h2>Available Notes</h2></div></div>
            {loading ? <div className="hw-empty-state"><Spinner animation="border" /><p>Loading notes...</p></div> : !notes.length ? <div className="hw-empty-state"><FaStickyNote /><h3>No notes available</h3><p>{isStaff ? 'Create notes for a class to see them here.' : 'Your teacher has not shared notes yet.'}</p></div> : <div className="notes-grid">{notes.map((note) => <article className="notes-card" key={note.ntid}><div className="notes-card-head"><span className="dashboard-explore-icon violet"><FaStickyNote /></span><div><h3>{note.clsnm || 'Class Notes'}{note.secnm ? ` · ${note.secnm}` : ''}</h3><small>{note.acdmcyr}</small></div>{isStaff && <div className="notes-actions"><button type="button" onClick={() => handleEdit(note)} aria-label="Edit notes"><FaEdit /></button><button type="button" className="danger" onClick={() => handleDelete(note)} aria-label="Delete notes"><FaTrash /></button></div>}</div><div className="notes-links">{(note.urls || []).map((item, index) => <a href={item.url} target="_blank" rel="noreferrer" key={item.nturlid || item.url}><FaDownload /><span>{fileNameFromUrl(item.url) || `Attachment ${index + 1}`}</span></a>)}</div></article>)}</div>}
          </section>}
        </div>
      </div>
    </Layout>
  );
}

export default NotesPage;
