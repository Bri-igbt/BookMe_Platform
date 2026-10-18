"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

import p6Image from "@/app/assets/P6.png";

import C1 from "@/app/assets/icons/C1.png";
import C2 from "@/app/assets/icons/C2.png";
import C3 from "@/app/assets/icons/C3.png";
import C4 from "@/app/assets/icons/C4.png";
import C5 from "@/app/assets/icons/C5.png";
import C6 from "@/app/assets/icons/C6.png";
import C7 from "@/app/assets/icons/C7.png";
import C8 from "@/app/assets/icons/C8.png";

import { userToast } from "@/app/context/ToastContext.jsx";

import {
  createServices,
  listServices,
  updateServices,
  deleteServices,
} from "@/app/api/services.js";

import {
  Plus,
  Save,
  X,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  FileText,
  Layers,
  Banknote,
  AlertCircle,
} from "lucide-react";

import { servicesPageStyles as s } from "@/app/assets/dummyStyles.jsx";

const ICON_MAP = {
  "C1.png": C1,
  "C2.png": C2,
  "C3.png": C3,
  "C4.png": C4,
  "C5.png": C5,
  "C6.png": C6,
  "C7.png": C7,
  "C8.png": C8,
};

const emptyForm = {
  name: "",
  duration: 30,
  price: 0,
  description: "",
  icon: "C1.png",
};

const formatMoney = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export default function Page() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingServiceId, setUpdatingServiceId] = useState("");

  const showToast = userToast();

  const applyServices = useCallback((items) => {
    setServices(Array.isArray(items) ? items : []);
  }, []);

  const loadServices = useCallback(async () => {
    try {
      const { data } = await listServices();

      const items =
        data?.services ??
        data?.service ??
        data?.data?.services ??
        data?.data?.service;

      if (!Array.isArray(items)) {
        throw new Error(
          "The server did not return a valid services list."
        );
      }

      applyServices(items);
      setMessage("");
    } catch (error) {
      console.error("Failed to load services:", error);

      setMessage(
        error.response?.data?.message ||
        error.message ||
        "Could not load services."
      );
    }
  }, [applyServices]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const serviceName = form.name.trim();

    if (!serviceName) {
      setMessage("Please enter a service name.");
      return;
    }

    const duration = Number(form.duration);
    const price = Number(form.price);

    if (!Number.isFinite(duration) || duration <= 0) {
      setMessage("Please enter a valid service duration.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setMessage("Please enter a valid service price.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...form,
        name: serviceName,
        duration,
        price,
        description: form.description.trim(),
      };

      if (editingId) {
        await updateServices(editingId, payload);
        showToast("Service updated successfully");
      } else {
        await createServices(payload);
        showToast("Service added successfully");
      }

      setForm({ ...emptyForm });
      setEditingId("");

      await loadServices();
    } catch (error) {
      console.error("Failed to save service:", error);

      showToast(
        error.response?.data?.message ||
        "Could not save service.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleService = async (service) => {
    if (updatingServiceId) return;

    setUpdatingServiceId(service._id);
    setMessage("");

    try {
      await updateServices(service._id, {
        isActive: !service.isActive,
      });

      await loadServices();

      showToast(
        service.isActive
          ? "Service hidden successfully"
          : "Service activated successfully"
      );
    } catch (error) {
      console.error("Failed to update service status:", error);

      showToast(
        error.response?.data?.message ||
        "Could not update service status.",
        "error"
      );
    } finally {
      setUpdatingServiceId("");
    }
  };

  const startEditing = (service) => {
    setEditingId(service._id);

    setForm({
      name: service.name || "",
      duration: service.duration ?? 30,
      price: service.price ?? 0,
      description: service.description || "",
      icon: service.icon || "C1.png",
    });

    setMessage("");
  };

  const cancelEditing = () => {
    setEditingId("");
    setForm({ ...emptyForm });
    setMessage("");
  };

  const confirmDelete = (service) => {
    setDeleteConfirm(service);
  };

  const executeDelete = async () => {
    if (!deleteConfirm || deleting) return;

    setDeleting(true);

    try {
      await deleteServices(deleteConfirm._id);

      if (editingId === deleteConfirm._id) {
        cancelEditing();
      }

      showToast("Service deleted successfully");

      setDeleteConfirm(null);

      await loadServices();
    } catch (error) {
      console.error("Failed to delete service:", error);

      showToast(
        error.response?.data?.message ||
        "Could not delete service.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className={s.mainGrid}>
        <section>
          <div className={s.headerRow}>
            <div>
              <p className={s.pageLabel}>Services</p>

              <h1 className={s.mainHeading}>
                Shape what customers can{" "}
                <span className={s.gradientText}>
                  book.
                </span>
              </h1>

              <p className={s.subText}>
                Add each appointment type with a duration
                and price. Active services appear on your
                public booking page.
              </p>
            </div>

            <div className={s.illustrationContainer}>
              <Image
                src={p6Image}
                alt="Services illustration"
                className={s.illustrationImg}
              />
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className={s.formCard}
          >
            <h3 className={s.formTitle}>
              <Plus className={s.formTitleIcon} />

              {editingId
                ? "Edit service"
                : "Add new service"}
            </h3>

            <div className={s.formGrid}>
              <label className={s.inputLabel}>
                Service name

                <div className={s.inputWrapper}>
                  <Layers className={s.inputIcon} />

                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    className={s.textInput}
                    placeholder="Consultation"
                    required
                  />
                </div>
              </label>

              <div className={s.durationPriceGrid}>
                <label className={s.inputLabel}>
                  Duration

                  <div className={s.inputWrapper}>
                    <Clock className={s.inputIcon} />

                    <select
                      name="duration"
                      value={form.duration}
                      onChange={handleChange}
                      className={s.selectInput}
                      required
                    >
                      {[15, 30, 45, 60, 90, 120].map(
                        (value) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {value} minutes
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </label>

                <label className={s.inputLabel}>
                  Price (₦)

                  <div className={s.inputWrapper}>
                    <Banknote
                      className={s.inputIcon}
                    />

                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      className={s.priceInput}
                      placeholder="5000"
                      required
                    />
                  </div>
                </label>
              </div>

              <label className={s.inputLabel}>
                Description

                <div className={s.textareaWrapper}>
                  <FileText
                    className={s.textareaIcon}
                  />

                  <textarea
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleChange}
                    className={s.textareaInput}
                    placeholder="A short customer-facing description"
                  />
                </div>
              </label>

              <fieldset className={s.inputLabel}>
                <legend>Service Icon</legend>

                <div className={s.iconGrid}>
                  {Object.entries(ICON_MAP).map(
                    ([iconName, iconImage]) => (
                      <button
                        key={iconName}
                        type="button"
                        aria-label={`Select ${iconName}`}
                        aria-pressed={
                          form.icon === iconName
                        }
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            icon: iconName,
                          }))
                        }
                        className={
                          form.icon === iconName
                            ? s.iconBtnActive
                            : s.iconBtnInactive
                        }
                      >
                        <Image
                          src={iconImage}
                          alt=""
                          className={s.iconImg}
                        />
                      </button>
                    )
                  )}
                </div>
              </fieldset>
            </div>

            <div className={s.formActions}>
              <button
                type="submit"
                disabled={loading}
                className={s.submitButton}
              >
                <Save className={s.submitIcon} />

                {loading
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add service"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={loading}
                  className={s.cancelButton}
                >
                  <X className={s.cancelIcon} />
                  Cancel
                </button>
              )}
            </div>

            {message && (
              <p
                className={s.message}
                role="alert"
              >
                {message}
              </p>
            )}
          </form>
        </section>

        <section className={s.rightSection}>
          <h2 className={s.rightTitle}>
            <Layers className={s.rightTitleIcon} />
            Your services
          </h2>

          <div className={s.serviceList}>
            {services.length === 0 && (
              <div className={s.emptyState}>
                <Layers className={s.emptyIcon} />

                <p className={s.emptyText}>
                  No services yet.
                </p>
              </div>
            )}

            {services.map((service) => {
              const serviceIcon =
                ICON_MAP[service.icon] || C1;

              const isUpdating =
                updatingServiceId === service._id;

              return (
                <article
                  key={service._id}
                  className={s.serviceCard}
                >
                  <div className={s.serviceCardInner}>
                    <div className={s.serviceInfoRow}>
                      <div
                        className={
                          s.serviceIconContainer
                        }
                      >
                        <Image
                          src={serviceIcon}
                          alt={`${service.name || "Service"} icon`}
                          className={
                            s.serviceIconImg
                          }
                        />
                      </div>

                      <div
                        className={
                          s.serviceTextBlock
                        }
                      >
                        <h3
                          className={s.serviceName}
                        >
                          {service.name}
                        </h3>

                        <p
                          className={s.serviceDetail}
                        >
                          {service.duration} min
                          {" · "}
                          {formatMoney(
                            service.price
                          )}
                        </p>

                        {service.description && (
                          <p
                            className={
                              s.serviceDesc
                            }
                          >
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={s.serviceActions}>
                      <button
                        type="button"
                        disabled={
                          Boolean(updatingServiceId)
                        }
                        onClick={() =>
                          toggleService(service)
                        }
                        aria-label={
                          service.isActive
                            ? "Hide service"
                            : "Activate service"
                        }
                        className={
                          service.isActive
                            ? s.visibilityBadgeActive
                            : s.visibilityBadgeInactive
                        }
                      >
                        {isUpdating ? (
                          "Updating..."
                        ) : (
                          <>
                            {service.isActive ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}

                            {service.isActive
                              ? "Active"
                              : "Hidden"}
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          startEditing(service)
                        }
                        className={s.editButton}
                        aria-label="Edit service"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          confirmDelete(service)
                        }
                        className={s.deleteButton}
                        aria-label="Delete service"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleting
            ) {
              setDeleteConfirm(null);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-service-title"
          >
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>

              <h2
                id="delete-service-title"
                className="text-xl font-bold text-slate-900 mb-2"
              >
                Delete Service
              </h2>

              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-700">
                  {deleteConfirm.name}
                </span>
                ? Existing bookings will remain, but
                customers will no longer be able to book
                this service. This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() =>
                    setDeleteConfirm(null)
                  }
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={executeDelete}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting
                    ? "Deleting..."
                    : "Delete Service"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

