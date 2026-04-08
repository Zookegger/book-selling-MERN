import React, { useState, useEffect } from "react";
import { categoryService, type ICategory } from "../../services/category.service";

const CategoryManager: React.FC = () => {
    // State phân trang và danh sách
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [treeData, setTreeData] = useState<ICategory[]>([]); // Để đổ vào thẻ <select>
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({ name: "", description: "", order: 0, parent: "" });
    const [editingId, setEditingId] = useState<string | null>(null);

    // Tạm thời giả định là Admin
    const isAdmin = true; 

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            // Lấy cả list (để hiện bảng) và tree (để hiện dropdown Parent)
            const [listRes, treeRes] = await Promise.all([
                categoryService.getList(1, 100), // Lấy tạm 100 item
                categoryService.getTree()
            ]);
            setCategories(listRes.data);
            setTreeData(treeRes);
        } catch (error: any) {
            alert(error.message || "Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await categoryService.update(editingId, formData);
                alert("Cập nhật thành công!");
            } else {
                await categoryService.create(formData);
                alert("Thêm mới thành công!");
            }
            // Reset form
            setFormData({ name: "", description: "", order: 0, parent: "" });
            setEditingId(null);
            fetchData();
        } catch (error: any) {
            alert(error.message || "Đã xảy ra lỗi khi lưu");
        }
    };

    const handleEdit = (cat: ICategory) => {
        setFormData({
            name: cat.name,
            description: cat.description || "",
            order: cat.order || 0,
            parent: typeof cat.parent === 'object' ? cat.parent._id : (cat.parent || "")
        });
        setEditingId(cat.id);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Xóa danh mục này? Hãy chắc chắn nó không có danh mục con.")) return;
        try {
            await categoryService.delete(id);
            fetchData();
        } catch (error: any) {
            alert(error.message || "Không thể xóa");
        }
    };

    // Hàm đệ quy để render dropdown options theo cấp bậc
    const renderTreeOptions = (nodes: ICategory[], prefix = "") => {
        return nodes.map(node => (
            <React.Fragment key={node.id}>
                {/* Không cho phép chọn chính nó làm Parent khi đang edit */}
                {node.id !== editingId && (
                    <option value={node.id}>
                        {prefix} {node.name}
                    </option>
                )}
                {node.children && node.children.length > 0 && 
                    renderTreeOptions(node.children, prefix + "— ")
                }
            </React.Fragment>
        ));
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 p-4">
            
            {/* Cột Form (Chỉ Admin) */}
            {isAdmin && (
                <div className="md:w-1/3 bg-white p-4 shadow rounded border border-gray-200">
                    <h2 className="text-xl font-bold mb-4">{editingId ? "Sửa Danh Mục" : "Thêm Danh Mục"}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Tên</label>
                            <input required type="text" className="w-full border p-2 rounded" 
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium">Danh mục Cha (Parent)</label>
                            <select className="w-full border p-2 rounded bg-white"
                                value={formData.parent} onChange={e => setFormData({...formData, parent: e.target.value})} >
                                <option value="">-- Không có (Danh mục gốc) --</option>
                                {renderTreeOptions(treeData)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Mô tả</label>
                            <textarea className="w-full border p-2 rounded"
                                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                                {editingId ? "Cập nhật" : "Tạo mới"}
                            </button>
                            {editingId && (
                                <button type="button" onClick={() => { setEditingId(null); setFormData({ name: "", description: "", order: 0, parent: "" }); }}
                                    className="bg-gray-400 text-white px-4 py-2 rounded">
                                    Hủy
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* Cột Danh sách */}
            <div className={`bg-white p-4 shadow rounded border border-gray-200 ${isAdmin ? 'md:w-2/3' : 'w-full'}`}>
                <h2 className="text-xl font-bold mb-4">Danh Sách Category</h2>
                {loading ? <p>Đang tải...</p> : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-2">Tên</th>
                                <th className="p-2">Slug</th>
                                {isAdmin && <th className="p-2">Hành động</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat.id} className="border-b">
                                    <td className="p-2 font-medium">{cat.name}</td>
                                    <td className="p-2 text-sm text-gray-500">{cat.slug}</td>
                                    {isAdmin && (
                                        <td className="p-2 flex gap-2">
                                            <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:underline">Sửa</button>
                                            <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:underline">Xóa</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CategoryManager;