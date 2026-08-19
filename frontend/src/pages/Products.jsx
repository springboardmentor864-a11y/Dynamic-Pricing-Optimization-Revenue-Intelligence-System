import { useState } from "react";
import { Plus } from "lucide-react";

import ProductStats from "../components/ProductStats";
import ProductTable from "../components/ProductTable";
import AddProductModal from "../components/AddProductModal";

export default function Products() {
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          <div>
            <h1 className="text-5xl font-bold text-gray-900">
              Products
            </h1>

            <p className="text-gray-500 text-lg mt-2">
              Manage all tracked products
            </p>
          </div>

          <button
            onClick={() => setOpenModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg transition"
          >
            <Plus size={20} />
            Add Product
          </button>

        </div>

        {/* Product Statistics */}
        <ProductStats />

        {/* Product Table */}
        <ProductTable />

      </div>

      {/* Add Product Modal */}
      <AddProductModal
        key={openModal ? "open" : "closed"}
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
      />
    </>
  );
}