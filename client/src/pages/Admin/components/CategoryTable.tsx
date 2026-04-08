import type { CategoryDto } from "@my-types/category.dto";
import "../components/AuthorTable.css";

interface CategoryTableProps {
  categories: CategoryDto[];
  onEdit: (category: CategoryDto) => void;
  onDelete: (id: string) => void;
}

export default function CategoryTable({
  categories,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  // Format ngày
  const formatDate = (date: string | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  // 🔥 Build children map (tối ưu, không filter nhiều lần)
  const childrenMap: Record<string, CategoryDto[]> = {};

categories.forEach((c) => {
  if (!c.parent) return;

  const parentId =
    typeof c.parent === "string"
      ? c.parent
      : c.parent.id;

  if (!childrenMap[parentId]) childrenMap[parentId] = [];
  childrenMap[parentId].push(c);
});

  return (
    <div className="author-table-wrapper">
      <table className="author-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Mô tả</th>
            <th>Số lượng</th>
            <th>Ngày tạo</th>
            <th>Hành động</th>
          </tr>
        </thead>

        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              {/* Tên */}
              <td className="column-name">
                <strong>{category.name}</strong>
                {category.slug && (
                  <span className="slug"> ({category.slug})</span>
                )}
              </td>

              {/* Mô tả */}
              <td>{category.description || "-"}</td>

              {/* Số lượng (tạm dùng order) */}
              <td>{category.order ?? "-"}</td>
              {/* Ngày tạo */}
              <td>{formatDate(category.createdAt)}</td>

              {/* Action */}
              <td className="actions">
                <button
                  className="btn btn-sm btn-edit"
                  onClick={() => onEdit(category)}
                  title="Chỉnh sửa"
                >
                  ✎
                </button>
                <button
                  className="btn btn-sm btn-delete"
                  onClick={() => onDelete(category.id)}
                  title="Xóa"
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}