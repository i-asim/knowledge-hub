import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, ArrowLeft, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Document {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Workspace {
  id: string;
  name: string;
  description: string | null;
}

const Workspace = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchWorkspace();
    fetchDocuments();
  }, [user, id, navigate]);

  const fetchWorkspace = async () => {
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error fetching workspace",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    } else {
      setWorkspace(data);
    }
  };

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching documents",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("documents")
      .insert({
        title: docTitle,
        content: docContent,
        workspace_id: id,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error creating document",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Document created successfully",
      });
      setDocuments([data, ...documents]);
      setDialogOpen(false);
      setDocTitle("");
      setDocContent("");
    }
  };

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    const { error } = await supabase
      .from("documents")
      .update({
        title: docTitle,
        content: docContent,
      })
      .eq("id", editingDoc.id);

    if (error) {
      toast({
        title: "Error updating document",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
      fetchDocuments();
      setDialogOpen(false);
      setEditingDoc(null);
      setDocTitle("");
      setDocContent("");
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", docId);

    if (error) {
      toast({
        title: "Error deleting document",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      setDocuments(documents.filter(doc => doc.id !== docId));
    }
  };

  const openEditDialog = (doc: Document) => {
    setEditingDoc(doc);
    setDocTitle(doc.title);
    setDocContent(doc.content);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingDoc(null);
    setDocTitle("");
    setDocContent("");
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-hero">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{workspace?.name}</h1>
              {workspace?.description && (
                <p className="text-sm text-muted-foreground">{workspace.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Documents</h2>
            <p className="mt-2 text-muted-foreground">
              Create and manage your knowledge base
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-md" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                New Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={editingDoc ? handleUpdateDocument : handleCreateDocument}>
                <DialogHeader>
                  <DialogTitle>
                    {editingDoc ? "Edit Document" : "Create New Document"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDoc 
                      ? "Update your document content" 
                      : "Create a new document to store your knowledge"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      placeholder="Meeting Notes"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Start writing..."
                      value={docContent}
                      onChange={(e) => setDocContent(e.target.value)}
                      className="min-h-[300px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingDoc ? "Update" : "Create"} Document
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {documents.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No documents yet</h3>
              <p className="mb-6 text-center text-muted-foreground">
                Create your first document to start building your knowledge base
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="group relative cursor-pointer shadow-md transition-all hover:shadow-lg hover:-translate-y-1"
                onClick={() => openEditDialog(doc)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {doc.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                    {doc.content || "No content yet"}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Workspace;
