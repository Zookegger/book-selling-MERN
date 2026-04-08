import { useState, useEffect } from "react";
import type { CategoryDto } from "@my-types/category.dto";
import "../components/AuthorForm.css";

interface CategoryFormProps {
  category?: CategoryDto | null;
  categories?: CategoryDto[];
  onSubmit: (data: Partial<CategoryDto>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CategoryForm({
  category,
  categories = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: CategoryFormProps) {
  const [formData, setFormData] = useState<Partial<CategoryDto>>({
    name: "",
    description: "",
    order: 0,
    parent: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 🔥 state cho ngày tạo
  const [createdAt, setCreatedAt] = useState(
    category?.createdAt
      ? new Date(category.createdAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        order: category.order || 0,
        parent:
          typeof category.parent === "string"
            ? category.parent
            : category.parent?.id,
      });

      setCreatedAt(
        category.createdAt
          ? new Date(category.createdAt).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16)
      );
    }
  }, [category]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.order !== undefined && formData.order < 0) {
      newErrors.order = "Order must be 0 or greater";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "order"
          ? Number(value)
          : value === ""
          ? undefined
          : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit({
        ...formData,
        parent:
          formData.parent && typeof formData.parent === "string"
            ? formData.parent
            : null,

        // ⚠️ CHỈ gửi nếu backend cho phép
        // createdAt: new Date(createdAt).toISOString(),
      });
    } catch (err) {}
  };

  return (
    <div className="author-form-overlay">
      <div className="author-form">
        <div className="author-form__header">
          <h2>{category ? "Chỉnh Sửa Thể Loại" : "Thêm Thể Loại Mới"}</h2>
          <button
            type="button"
            className="author-form__close"
            onClick={onCancel}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="author-form__body">
          {/* Tên */}
          <div className="form-group">
            <label>
              Tên thể loại <span className="required">*</span>
            </label>
            <input
              name="name"
              type="text"
              placeholder="Nhập tên thể loại"
              value={formData.name || ""}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.name ? "input-error" : ""}
            />
            {errors.name && (
              <span className="error-message">{errors.name}</span>
            )}
          </div>

          {/* Mô tả */}
          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              name="description"
              placeholder="Nhập mô tả"
              value={formData.description || ""}
              onChange={handleChange}
              disabled={isLoading}
              rows={4}
            />
          </div>

          {/* Số lượng */}
          <div className="form-group">
            <label>Số lượng</label>
            <input
              name="order"
              type="number"
              min={0}
              placeholder="0"
              value={formData.order ?? 0}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.order ? "input-error" : ""}
            />
            {errors.order && (
              <span className="error-message">{errors.order}</span>
            )}
          </div>

          {/* 🔥 Ngày tạo (có thể chỉnh) */}
          <div className="form-group">
            <label>Ngày tạo</label>
            <input
              type="datetime-local"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="author-form__footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading
                ? "Đang lưu..."
                : category
                ? "Cập Nhật"
                : "Thêm Mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}