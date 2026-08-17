import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Form, Spinner } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBookOpen,
  FaCalendarAlt,
  FaDownload,
  FaEdit,
  FaExclamationCircle,
  FaLayerGroup,
  FaPlus,
  FaTrash,
  FaCloudUploadAlt,
  FaTimes,
} from 'react-icons/fa';
import Layout from '../common/Layout';
import { AuthContext } from '../../App';
import {
  fetchInstituteNames,
  fetchBranchNames,
  fetchAcademicYears,
  fetchBranchClasses,
  fetchClassSections,
  fetchClassSubjects,
  createHomeworkUpload,
  fetchHomeWorkUploads,
  updateHomeworkUpload,
  deleteHomeworkUpload,
  uploadHomeworkAttachment,
} from '../../services/HomeworkServices/homeworkServices';
import {
  hasAnyPermission,
  USER_PORTAL_PERMISSIONS,
} from '../../services/commonUtills/FormValidations';

const formatHomeworkDate = (value) => {
  if (!value) return 'Recently added';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently added';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getHomeworkAsset = (homework) =>
  String(homework?.imguid || homework?.imguld || '').trim();

function HomeworkPage() {
  const { stateAuth } = useContext(AuthContext);
  const user = stateAuth?.user || {};
  const userType = String(user.typ || '').toUpperCase();

  const canViewHomework =
    ['STUDENT', 'STAFF'].includes(userType) &&
    hasAnyPermission(user.cds, USER_PORTAL_PERMISSIONS.HOMEWORK);
  const canCreateHomework =
    userType === 'STAFF' &&
    hasAnyPermission(user.cds, USER_PORTAL_PERMISSIONS.HOMEWORK_CREATE);
  const canUpdateHomework =
    userType === 'STAFF' &&
    hasAnyPermission(user.cds, USER_PORTAL_PERMISSIONS.HOMEWORK_UPDATE);
  const canDeleteHomework =
    userType === 'STAFF' &&
    hasAnyPermission(user.cds, USER_PORTAL_PERMISSIONS.HOMEWORK_DELETE);
  const canManageHomework = canCreateHomework || canUpdateHomework || canDeleteHomework;

  const navigate = useNavigate();
  const location = useLocation();
  const homeworkFromRoute = location.state?.homeworkToEdit;

  const [institutes, setInstitutes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [instituteId, setInstituteId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [homeworkList, setHomeworkList] = useState([]);
  const [fetchError, setFetchError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [editingHomework, setEditingHomework] = useState(null);
  const [formAlert, setFormAlert] = useState({
    show: false,
    message: '',
    variant: 'danger',
  });
  const [feedAlert, setFeedAlert] = useState({
    show: false,
    message: '',
    variant: 'danger',
  });

  const [activeTab, setActiveTab] = useState('list');

  const isEditing = Boolean(editingHomework);
  const showComposerTab = canCreateHomework || isEditing;

  const sortedHomeworkList = useMemo(() => {
    return [...homeworkList].sort((left, right) => {
      const leftTime = new Date(left.crtdt || left.upddt || 0).getTime();
      const rightTime = new Date(right.crtdt || right.upddt || 0).getTime();
      return rightTime - leftTime;
    });
  }, [homeworkList]);

  const showTemporaryAlert = (setAlert, message, variant = 'danger') => {
    setAlert({ show: true, message, variant });
    window.setTimeout(() => {
      setAlert((current) =>
        current.message === message
          ? { show: false, message: '', variant: 'danger' }
          : current
      );
    }, 5000);
  };

  const populateFormForHomework = async (homework) => {
    if (!homework) return;

    setInstituteId(String(homework.fkinstid || user.instid || ''));
    setBranchId(String(homework.fkbrcid || user.brcid || ''));
    setAcademicYear(String(homework.acdmcyr || user.acdmcyr || ''));
    setClassId(String(homework.fkclsid || user.clsid || ''));
    setSectionId(String(homework.fksecid || user.secid || ''));
    setSubjectId(String(homework.fksubid || ''));
    setDescription(homework.desc || '');
    setImageUrl(getHomeworkAsset(homework));
    setAttachmentName(getHomeworkAsset(homework).split('/').pop() || 'Current attachment');

    if (homework.fkinstid) {
      await loadBranches(homework.fkinstid);
    }
    if (homework.fkbrcid && (homework.acdmcyr || user.acdmcyr)) {
      await loadClasses(homework.fkbrcid, homework.acdmcyr || user.acdmcyr);
    }
    if (homework.fkclsid) {
      await loadClassDetails(homework.fkclsid);
    }
  };

  const clearComposer = () => {
    setEditingHomework(null);
    setDescription('');
    setImageUrl('');
    setAttachmentName('');
    setSubjectId('');
    setFormAlert({ show: false, message: '', variant: 'danger' });

    setActiveTab('list');

    if (location.state?.homeworkToEdit) {
      navigate('/homework', { replace: true });
    }
  };

  useEffect(() => {
    if (!canManageHomework) return;

    if (user.instid && user.instnm) {
      setInstitutes([{ instid: user.instid, instnm: user.instnm }]);
      setInstituteId(String(user.instid));
    }
    if (user.brcid && user.brcnm) {
      setBranches([{ brcid: user.brcid, brcnm: user.brcnm }]);
      setBranchId(String(user.brcid));
    }
    if (user.acdmcyr) {
      setAcademicYears([{ yrid: user.acdmcyr, yrnm: user.acdmcyr }]);
      setAcademicYear(String(user.acdmcyr));
    }
    if (user.clsid) {
      setClassId(String(user.clsid));
    }
    if (user.secid) {
      setSectionId(String(user.secid));
    }

    // Load full lists in the background
    loadInstitutes();
    loadAcademicYears();

    if (user.instid) {
      loadBranches(user.instid);
    }
    if (user.brcid && user.acdmcyr) {
      loadClasses(user.brcid, user.acdmcyr);
    }
    if (user.clsid) {
      loadClassDetails(user.clsid);
    }
  }, [user.instid, user.instnm, user.brcid, user.brcnm, user.acdmcyr, user.clsid, user.secid, canManageHomework]);

  useEffect(() => {
    if (canViewHomework) fetchHomeworkData();
  }, [user.instid, user.brcid, user.clsid, user.secid, user.stfid, user.typ, canViewHomework]);

  useEffect(() => {
    if (!canManageHomework || !homeworkFromRoute) return;
    if (!canUpdateHomework && !canCreateHomework) return;

    setEditingHomework(homeworkFromRoute);
    setActiveTab('create');
    populateFormForHomework(homeworkFromRoute);
  }, [homeworkFromRoute, canManageHomework, canUpdateHomework, canCreateHomework]);

  const fetchHomeworkData = async () => {
    setIsFetching(true);
    setFetchError('');
    const params = {
      typ: user.typ,
      instid: user.instid,
      brcid: user.brcid,
      clsid: user.clsid,
      secid: user.secid,
      stfid: user.stfid,
      acdmcyr: user.acdmcyr,
      usrid: user.usrid,
    };
    const res = await fetchHomeWorkUploads(params);
    setIsFetching(false);
    if (res && res.status === 'success') {
      setHomeworkList(res.payload || []);
      setFetchError('');
    } else {
      setFetchError(res?.error?.message || 'Failed to Fetch Home Work');
    }
  };

  const startEdit = async (homework) => {
    if (!canUpdateHomework) return;

    setEditingHomework(homework);
    setActiveTab('create');
    await populateFormForHomework(homework);
  };

  const handleDelete = async (hmwkudid) => {
    if (!canDeleteHomework) return;
    if (!window.confirm('Are you sure you want to delete this Home Work?')) return;

    setDeletingId(hmwkudid);
    const res = await deleteHomeworkUpload({ hmwkudid });
    setDeletingId('');

    if (res && res.status === 'success') {
      showTemporaryAlert(setFeedAlert, 'Homework deleted successfully.', 'success');
      fetchHomeworkData();
    } else {
      showTemporaryAlert(
        setFeedAlert,
        res?.error?.message || 'Failed to delete homework.'
      );
    }
  };

  const loadInstitutes = async () => {
    const res = await fetchInstituteNames({});
    if (res?.status === 'success' && res.payload) {
      setInstitutes(res.payload);
    }
  };

  const loadAcademicYears = async () => {
    const res = await fetchAcademicYears({});
    if (res?.status === 'success' && res.payload) {
      setAcademicYears(res.payload);
    }
  };

  const loadBranches = async (instId) => {
    const res = await fetchBranchNames({ instid: instId });
    if (res?.status === 'success' && res.payload) {
      setBranches(res.payload);
    }
  };

  const loadClasses = async (brcId, acdmCyr) => {
    if (!acdmCyr) return;
    const res = await fetchBranchClasses({ brcid: brcId, acdmcyr: acdmCyr });
    if (res?.status === 'success' && res.payload) {
      setClassesList(res.payload);
    }
  };

  const handleInstituteChange = async (e) => {
    const val = e.target.value;
    setInstituteId(val);
    setBranchId('');
    setClassId('');
    setSectionId('');
    setSubjectId('');
    setBranches([]);
    setClassesList([]);
    setSections([]);
    setSubjects([]);
    if (val) {
      loadBranches(val);
    }
  };

  const handleBranchChange = async (e) => {
    const val = e.target.value;
    setBranchId(val);
    setClassId('');
    setSectionId('');
    setSubjectId('');
    setClassesList([]);
    setSections([]);
    setSubjects([]);
    if (val) {
      loadClasses(val, academicYear);
    }
  };

  const loadClassDetails = async (clsId) => {
    const [resSec, resSub] = await Promise.all([
      fetchClassSections({ clsid: clsId }),
      fetchClassSubjects({ clsid: clsId }),
    ]);
    if (resSec?.status === 'success' && resSec.payload) {
      setSections(resSec.payload);
    }
    if (resSub?.status === 'success' && resSub.payload) {
      setSubjects(resSub.payload);
    }
  };

  const handleClassChange = async (e) => {
    const val = e.target.value;
    setClassId(val);
    setSectionId('');
    setSubjectId('');
    setSections([]);
    setSubjects([]);
    if (val) {
      loadClassDetails(val);
    }
  };

  const handleSubmit = async () => {
    if (isEditing && !canUpdateHomework) return;
    if (!isEditing && !canCreateHomework) return;

    if (!instituteId || !branchId || !academicYear || !classId || !sectionId || !subjectId || !description) {
      showTemporaryAlert(setFormAlert, 'Please fill all required fields.');
      return;
    }

    const homeworkImageUrl = imageUrl.trim();
    if (!homeworkImageUrl) {
      showTemporaryAlert(
        setFormAlert,
        'Please upload an image or PDF before saving.'
      );
      return;
    }

    setIsSaving(true);

    const payload = {
      fkinstid: instituteId,
      fkbrcid: branchId,
      desc: description,
      fkclsid: classId,
      fksubid: subjectId,
      fksecid: sectionId,
      stfid: user.stfid || '',
      imguid: homeworkImageUrl,
      acdmcyr: academicYear,
      usrid: user.usrid,
    };

    const res = isEditing
      ? await updateHomeworkUpload({
          ...payload,
          hmwkudid: editingHomework.hmwkudid,
          updby: user.usrid,
        })
      : await createHomeworkUpload(payload);

    setIsSaving(false);

    if (res && res.status === 'success') {
      showTemporaryAlert(
        setFeedAlert,
        isEditing
          ? 'Homework updated successfully.'
          : 'Homework created successfully.',
        'success'
      );

      if (!isEditing) {
        setSubjectId('');
      }

      setDescription('');
      setImageUrl('');
      setAttachmentName('');
      setEditingHomework(null);
      setActiveTab('list');
      if (location.state?.homeworkToEdit) {
        navigate('/homework', { replace: true });
      }
      fetchHomeworkData();
    } else {
      showTemporaryAlert(
        setFormAlert,
        res?.error?.message ||
          `Failed to ${isEditing ? 'update' : 'create'} homework.`
      );
    }
  };

  const handleAttachmentChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showTemporaryAlert(setFormAlert, 'Please select a JPG, PNG, WebP, or PDF file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showTemporaryAlert(setFormAlert, 'Attachment must be smaller than 10 MB.');
      return;
    }

    setIsUploading(true);
    const response = await uploadHomeworkAttachment(file);
    setIsUploading(false);
    const uploadedUrl = response?.payload?.url || response?.url || '';
    if (response?.status === 'success' && uploadedUrl) {
      setImageUrl(uploadedUrl);
      setAttachmentName(file.name);
      return;
    }
    showTemporaryAlert(
      setFormAlert,
      response?.error?.message || 'Unable to upload the attachment. Please try again.'
    );
  };

  const removeAttachment = () => {
    setImageUrl('');
    setAttachmentName('');
  };

  return (
    <Layout>
      <div className="hw-page">
        <div className="hw-shell">
          <div className="hw-mobile-header">
            <button
              type="button"
              className="hw-icon-btn"
              onClick={() => navigate('/dashboard')}
              aria-label="Go back"
            >
              <FaArrowLeft />
            </button>

            <div className="hw-header-copy">
              <span className="hw-kicker">Homework</span>
              <h1>{activeTab === 'create' ? (isEditing ? 'Edit Homework' : 'Create Homework') : 'View Homework'}</h1>
              <p>{activeTab === 'create' ? 'Add the homework details and attachment.' : 'Your latest class assignments in one place.'}</p>
            </div>
          </div>

          {!canManageHomework && !canViewHomework && (
            <Alert variant="info" className="mb-0">
              You do not have access to homework.
            </Alert>
          )}

          {activeTab === 'create' && showComposerTab && (
            <section className="hw-composer-card">
              <div className="hw-composer-head">
                <div>
                  <span className="hw-kicker">
                    {isEditing ? 'Update assignment' : 'New assignment'}
                  </span>
                  <h2>{isEditing ? 'Edit homework' : 'Create homework'}</h2>
                  <p>
                    Keep it simple for mobile: choose the class, add the task,
                    and attach a link.
                  </p>
                </div>
                <span className="hw-status-badge hw-status-badge-primary">
                  {isEditing ? 'Editing' : 'Draft'}
                </span>
              </div>

              {formAlert.show && (
                <Alert
                  variant={formAlert.variant}
                  onClose={() =>
                    setFormAlert({ show: false, message: '', variant: 'danger' })
                  }
                  dismissible
                >
                  {formAlert.message}
                </Alert>
              )}

              <Form className="hw-form-grid">
                <Form.Group>
                  <Form.Label>
                    Institute <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select value={instituteId} onChange={handleInstituteChange}>
                    <option value="">Select institute</option>
                    {institutes.map((inst) => (
                      <option key={inst.instid} value={inst.instid}>
                        {inst.instnm}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label>
                    Branch <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={branchId}
                    onChange={handleBranchChange}
                    disabled={!instituteId}
                  >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch.brcid} value={branch.brcid}>
                        {branch.brcnm}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label>
                    Academic year <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={academicYear}
                    onChange={(event) => setAcademicYear(event.target.value)}
                  >
                    <option value="">Select academic year</option>
                    {academicYears.map((year) => (
                      <option key={year.yrid} value={year.yrnm}>
                        {year.yrnm}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label>
                    Class <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={classId}
                    onChange={handleClassChange}
                    disabled={!branchId}
                  >
                    <option value="">Select class</option>
                    {classesList.map((classItem) => (
                      <option key={classItem.clsid} value={classItem.clsid}>
                        {classItem.clsnm}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label>
                    Section <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={sectionId}
                    onChange={(event) => setSectionId(event.target.value)}
                    disabled={!classId}
                  >
                    <option value="">Select section</option>
                    {sections.map((section) => (
                      <option key={section.secid} value={section.secid}>
                        {section.secnm}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label>
                    Subject <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={subjectId}
                    onChange={(event) => setSubjectId(event.target.value)}
                    disabled={!classId}
                  >
                    <option value="">Select subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.subid} value={subject.subid}>
                        {subject.subnm}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="hw-form-grid-full">
                  <Form.Label>
                    Description <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Describe the homework in a student-friendly way..."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </Form.Group>

                <Form.Group className="hw-form-grid-full">
                  <Form.Label>
                    Attachment <span className="text-danger">*</span>
                  </Form.Label>
                  <label className={`hw-upload-dropzone ${isUploading ? 'is-uploading' : ''}`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleAttachmentChange}
                      disabled={isUploading || isSaving}
                    />
                    <span className="hw-upload-icon">
                      {isUploading ? <Spinner animation="border" size="sm" /> : <FaCloudUploadAlt />}
                    </span>
                    <span className="hw-upload-copy">
                      <strong>{isUploading ? 'Uploading attachment...' : imageUrl ? 'Replace attachment' : 'Upload image or PDF'}</strong>
                      <small>Tap to choose a file · JPG, PNG, WebP or PDF · Max 10 MB</small>
                    </span>
                  </label>
                  <Form.Text className="text-muted">
                    The file will be securely uploaded and added to this homework.
                  </Form.Text>
                </Form.Group>
              </Form>

              {imageUrl && (
                <div className="hw-attachment-preview">
                  <div className="hw-attachment-copy">
                    <span className="hw-kicker">Attachment preview</span>
                    <strong>{attachmentName || (imageUrl.toLowerCase().endsWith('.pdf') ? 'PDF attachment' : 'Image attachment')}</strong>
                  </div>
                  <button type="button" className="hw-remove-attachment" onClick={removeAttachment} aria-label="Remove attachment"><FaTimes /> Remove</button>
                  {imageUrl.toLowerCase().endsWith('.pdf') ? (
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hw-link-btn"
                    >
                      <FaDownload /> Open PDF
                    </a>
                  ) : (
                    <img
                      src={imageUrl}
                      alt="Homework attachment"
                      className="hw-feed-image"
                    />
                  )}
                </div>
              )}

              <div className="hw-submit-bar">
                <button
                  type="button"
                  className="hw-secondary-btn"
                  onClick={clearComposer}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="hw-primary-btn"
                  onClick={handleSubmit}
                  disabled={isSaving || isUploading}
                >
                  {isSaving ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" />
                      Saving...
                    </>
                  ) : isEditing ? (
                    'Update homework'
                  ) : (
                    'Publish homework'
                  )}
                </button>
              </div>
            </section>
          )}

          {canViewHomework && activeTab === 'list' && (
            <section className="hw-feed-section">
              <div className="hw-feed-toolbar">
                <div>
                  <span className="hw-kicker">{sortedHomeworkList.length} {sortedHomeworkList.length === 1 ? 'assignment' : 'assignments'}</span>
                  <h2>View Homework</h2>
                </div>

              </div>

              {fetchError && (
                <Alert variant="danger">
                  <FaExclamationCircle className="me-2" />
                  {fetchError}
                </Alert>
              )}

              {feedAlert.show && (
                <Alert
                  variant={feedAlert.variant}
                  onClose={() =>
                    setFeedAlert({ show: false, message: '', variant: 'danger' })
                  }
                  dismissible
                >
                  {feedAlert.message}
                </Alert>
              )}

              {isFetching && sortedHomeworkList.length === 0 && (
                <div className="hw-empty-state">
                  <Spinner animation="border" />
                  <p>Loading homework feed...</p>
                </div>
              )}

              {!isFetching && sortedHomeworkList.length === 0 && !fetchError && (
                <div className="hw-empty-state">
                  <FaBookOpen />
                  <p>No homework has been posted yet.</p>
                </div>
              )}

              <div className="hw-feed-list">
                {sortedHomeworkList.map((homework) => {
                  const assetUrl = getHomeworkAsset(homework);
                  const isPdf = assetUrl.toLowerCase().endsWith('.pdf');

                  return (
                    <article className="hw-feed-card" key={homework.hmwkudid}>
                      <div className="hw-feed-top">
                        <div>
                          <div className="hw-feed-title-row">
                            <h3>{homework.sbnm || 'Homework'}</h3>
                            <span className="hw-status-badge">
                              <FaCalendarAlt />
                              {formatHomeworkDate(homework.crtdt)}
                            </span>
                          </div>

                          <div className="hw-feed-tags">
                            {homework.clsnm && (
                              <span className="hw-tag">
                                <FaLayerGroup />
                                {homework.clsnm}
                              </span>
                            )}
                            {homework.senm && <span className="hw-tag">{homework.senm}</span>}
                          </div>
                        </div>

                        {(canUpdateHomework || canDeleteHomework) && (
                          <div className="hw-card-actions">
                            {canUpdateHomework && (
                              <button
                                type="button"
                                className="hw-action-btn hw-action-edit"
                                onClick={() => startEdit(homework)}
                                aria-label="Edit homework"
                              >
                                <FaEdit />
                              </button>
                            )}
                            {canDeleteHomework && (
                              <button
                                type="button"
                                className="hw-action-btn hw-action-delete"
                                onClick={() => handleDelete(homework.hmwkudid)}
                                disabled={deletingId === homework.hmwkudid}
                                aria-label="Delete homework"
                              >
                                {deletingId === homework.hmwkudid ? (
                                  <Spinner as="span" animation="border" size="sm" />
                                ) : (
                                  <FaTrash />
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="hw-feed-description">{homework.desc}</p>

                      {assetUrl && (
                        <div className="hw-feed-media">
                          {isPdf ? (
                            <a
                              href={assetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="hw-link-btn"
                            >
                              <FaDownload /> Open attachment
                            </a>
                          ) : (
                            <img
                              src={assetUrl}
                              alt={homework.sbnm || 'Homework attachment'}
                              className="hw-feed-image"
                            />
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {canCreateHomework && (
                <button
                  type="button"
                  className="hw-fab"
                  onClick={() => setActiveTab('create')}
                  aria-label="Create homework"
                >
                  <FaPlus />
                </button>
              )}
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default HomeworkPage;
