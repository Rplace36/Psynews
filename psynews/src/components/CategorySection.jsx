import { useCategories } from "../hooks/useArticles";
import CategoryArticles from "./CategoryArticles";
import "./CategorySection.css";

export default function CategorySection() {
  const { data: categories, loading } = useCategories();

  if (loading || !categories) return null;

  return (
    <div className="categories-wrapper">
      {categories.map((cat, i) => (
        <CategoryArticles key={cat.id} cat={cat} alt={i % 2 === 1} />
      ))}
    </div>
  );
}
