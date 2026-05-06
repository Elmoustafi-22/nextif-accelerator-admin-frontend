import { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import Input from "../../components/Input";
import Button from "../../components/Button";
import axiosInstance from "../../api/axiosInstance";
import AdminDetailsModal from "../../components/AdminDetailsModal";

interface Admin {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  avatar?: string;
  role: string;
  accountStatus: string;
  createdAt: string;
}

const AdminDirectoryPage = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axiosInstance.get("/admin/list");
        setAdmins(response.data);
      } catch (error) {
        console.error("Failed to fetch admins", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const filteredAdmins = admins.filter((admin) =>
    `${admin.firstName} ${admin.lastName} ${admin.title || ""} ${admin.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-neutral-900">
            Team Directory
          </h1>
          <p className="text-neutral-500 mt-1">
            View and connect with other administrators.
          </p>
        </div>
        <div className="w-full md:w-96">
          <Input
            placeholder="Search by name, title, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={20} />}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm animate-pulse h-64"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAdmins.map((admin) => (
            <div
              key={admin._id}
              className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-2xl uppercase mb-4 overflow-hidden ring-4 ring-blue-50/50 group-hover:ring-blue-100 transition-all">
                  {admin.avatar ? (
                    <img
                      src={admin.avatar}
                      alt={admin.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      {admin.firstName?.[0]}
                      {admin.lastName?.[0]}
                    </>
                  )}
                </div>
                <h3 className="font-bold text-lg text-neutral-900">
                  {admin.firstName} {admin.lastName}
                </h3>
                <p className="text-sm text-blue-600 font-medium mb-1">
                  {admin.title || "Administrator"}
                </p>
                <p className="text-xs text-neutral-500 mb-6">{admin.email}</p>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setSelectedAdmin(admin)}
                >
                  View Profile
                </Button>
              </div>
            </div>
          ))}

          {filteredAdmins.length === 0 && (
            <div className="col-span-full py-12 text-center text-neutral-400">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No team members found matching your search.</p>
            </div>
          )}
        </div>
      )}

      {selectedAdmin && (
        <AdminDetailsModal
          admin={selectedAdmin}
          isOpen={!!selectedAdmin}
          onClose={() => setSelectedAdmin(null)}
        />
      )}
    </>
  );
};

export default AdminDirectoryPage;
