import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  getCategories, 
  createCategory, 
  updateCategory,
  deleteCategory 
} from "@/lib/storage";
import type { Category, InsertCategory } from "@shared/schema";

interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
  defaultHours: number;
}

const CATEGORY_ICONS = [
  { icon: "fas fa-book", label: "Book" },
  { icon: "fas fa-bed", label: "Sleep" },
  { icon: "fas fa-dumbbell", label: "Workout" },
  { icon: "fas fa-briefcase", label: "Work" },
  { icon: "fas fa-gamepad", label: "Games" },
  { icon: "fas fa-utensils", label: "Food" },
  { icon: "fas fa-car", label: "Travel" },
  { icon: "fas fa-music", label: "Music" },
  { icon: "fas fa-film", label: "Movies" },
  { icon: "fas fa-heart", label: "Health" },
  { icon: "fas fa-users", label: "Social" },
  { icon: "fas fa-palette", label: "Art" },
];

const CATEGORY_COLORS = [
  "hsl(217, 91%, 60%)", // Blue
  "hsl(262, 83%, 69%)", // Purple
  "hsl(158, 64%, 52%)", // Green
  "hsl(25, 95%, 53%)",  // Orange
  "hsl(348, 86%, 61%)", // Red
  "hsl(45, 93%, 47%)",  // Yellow
  "hsl(200, 98%, 39%)", // Cyan
  "hsl(319, 84%, 62%)", // Pink
  "hsl(142, 71%, 45%)", // Emerald
  "hsl(271, 91%, 65%)", // Violet
];

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    icon: "fas fa-star",
    color: CATEGORY_COLORS[0],
    defaultHours: 0
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: CategoryFormData) => {
      const order = Math.max(...categories.map(c => c.order), 0) + 1;
      return createCategory({ ...category, order });
    },
    onSuccess: () => {
      toast({ title: "Category created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create category", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertCategory> }) => {
      return updateCategory(id, updates);
    },
    onSuccess: () => {
      toast({ title: "Category updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update category", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast({ title: "Category deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete category", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      icon: "fas fa-star",
      color: CATEGORY_COLORS[0],
      defaultHours: 0
    });
    setShowAddCategory(false);
    setEditingCategory(null);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color,
      defaultHours: category.defaultHours
    });
    setShowAddCategory(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Please enter a category name", variant: "destructive" });
      return;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        updates: formData
      });
    } else {
      createCategoryMutation.mutate(formData);
    }
  };

  const handleDelete = (category: Category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"? This will remove all associated data.`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Settings</h1>
          <p className="text-xs text-gray-400">Manage your categories and preferences</p>
        </div>
        <button 
          className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
          onClick={() => setLocation("/")}
        >
          <i className="fas fa-arrow-left text-gray-300"></i>
        </button>
      </div>

      {/* Categories Section */}
      <div className="bg-dark-secondary rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Categories</h3>
          <button 
            className="bg-study-blue text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
            onClick={() => setShowAddCategory(true)}
          >
            <i className="fas fa-plus"></i>
            <span>Add Category</span>
          </button>
        </div>
        
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-3 bg-dark-tertiary rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: category.color }}
                >
                  <i className={`${category.icon} text-white`}></i>
                </div>
                <span className="font-medium">{category.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  className="w-8 h-8 bg-dark-primary rounded-full flex items-center justify-center hover:bg-opacity-80 transition-colors"
                  onClick={() => handleEdit(category)}
                >
                  <i className="fas fa-edit text-study-blue text-sm"></i>
                </button>
                <button 
                  className="w-8 h-8 bg-dark-primary rounded-full flex items-center justify-center hover:bg-opacity-80 transition-colors"
                  onClick={() => handleDelete(category)}
                >
                  <i className="fas fa-trash text-red-500 text-sm"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-secondary rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button 
                onClick={resetForm}
                className="w-8 h-8 bg-dark-tertiary rounded-full flex items-center justify-center"
              >
                <i className="fas fa-times text-text-muted"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Category Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                  className="w-full bg-dark-tertiary border border-dark-primary rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {CATEGORY_ICONS.map((iconOption) => (
                    <button
                      key={iconOption.icon}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        formData.icon === iconOption.icon 
                          ? 'bg-study-blue' 
                          : 'bg-dark-tertiary hover:bg-dark-primary'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, icon: iconOption.icon }))}
                    >
                      <i className={`${iconOption.icon} text-white text-sm`}></i>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORY_COLORS.map((colorOption) => (
                    <button
                      key={colorOption}
                      className={`w-10 h-10 rounded-lg border-2 transition-colors ${
                        formData.color === colorOption 
                          ? 'border-white' 
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: colorOption }}
                      onClick={() => setFormData(prev => ({ ...prev, color: colorOption }))}
                    />
                  ))}
                </div>
              </div>

              {/* Default Hours Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Default Hours</label>
                <input 
                  type="number" 
                  value={formData.defaultHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultHours: Number(e.target.value) || 0 }))}
                  placeholder="Enter default hours"
                  className="w-full bg-dark-tertiary border border-dark-primary rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Preview */}
              <div className="p-3 bg-dark-tertiary rounded-lg">
                <label className="block text-sm font-medium mb-2">Preview</label>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: formData.color }}
                  >
                    <i className={`${formData.icon} text-white`}></i>
                  </div>
                  <span className="font-medium">{formData.name || "Category Name"}</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button 
                className="flex-1 bg-dark-tertiary text-text-primary py-3 rounded-lg font-medium"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button 
                className="flex-1 bg-study-blue text-white py-3 rounded-lg font-medium disabled:opacity-50"
                onClick={handleSubmit}
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending || updateCategoryMutation.isPending 
                  ? "Saving..." 
                  : editingCategory ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}