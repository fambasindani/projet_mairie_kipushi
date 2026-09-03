import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Upload, Download, Trash2, FileText } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';
import ConfirmModal from './ui/ConfirmModal';
import { documentService } from '../services/documentService';
import type { Document } from '../types';

const typeLabels: Record<string, string> = {
  CNI: 'Carte Nationale d\'Identité',
  PASSEPORT: 'Passeport',
  STATUTS: 'Statuts',
  RCCM: 'Registre de Commerce',
  PATENTE: 'Patente',
  QUITTANCE: 'Quittance',
  AVATAR: 'Photo de profil',
  AUTRE: 'Autre',
};

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  personneId: number;
}

export default function DocumentModal({ isOpen, onClose, personneId }: DocumentModalProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [typeDoc, setTypeDoc] = useState('CNI');
  const [numero, setNumero] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Document | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!personneId) return;
    setLoading(true);
    try {
      const res = await documentService.byPersonne(personneId);
      const items = Array.isArray(res) ? res : ((res as unknown as { data?: unknown[] })?.data ?? []);
      setDocuments(items as Document[]);
    } catch {
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  }, [personneId]);

  useEffect(() => {
    if (isOpen) fetchDocuments();
  }, [isOpen, fetchDocuments]);

  const handleUpload = async () => {
    if (!file) { toast.error('Sélectionnez un fichier'); return; }
    setUploading(true);
    try {
      await documentService.upload(personneId, file, typeDoc, numero || undefined);
      toast.success('Document uploadé avec succès');
      setFile(null);
      setNumero('');
      setTypeDoc('CNI');
      fetchDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'upload';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(documentService.downloadUrl(doc.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.fichier.split('/').pop() ?? `document_${doc.id}`;
      window.document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await documentService.delete(confirmDelete.id);
      toast.success('Document supprimé');
      setConfirmDelete(null);
      fetchDocuments();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition";

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Documents" size="lg">
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Ajouter un document</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <select value={typeDoc} onChange={(e) => setTypeDoc(e.target.value)} className={inputClass}>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Numéro (optionnel)"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className={inputClass}
              />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className={inputClass}
              />
            </div>
            <Button
              icon={<Upload size={14} />}
              onClick={handleUpload}
              disabled={!file || uploading}
              size="sm"
            >
              {uploading ? 'Envoi...' : 'Uploader'}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Aucun document trouvé</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <FileText size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {typeLabels[doc.type_document] ?? doc.type_document}
                      </p>
                      <p className="text-xs text-slate-400">
                        {doc.numero ? `N° ${doc.numero}` : '—'}
                        {doc.date_expiration && ` · Exp. ${new Date(doc.date_expiration).toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={doc.est_valide ? 'success' : 'danger'}>
                      {doc.est_valide ? 'Valide' : 'Invalide'}
                    </Badge>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Télécharger"
                    >
                      <Download size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(doc)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer le document"
        message={`Êtes-vous sûr de vouloir supprimer le document "${typeLabels[confirmDelete?.type_document ?? '']}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />
    </>
  );
}
