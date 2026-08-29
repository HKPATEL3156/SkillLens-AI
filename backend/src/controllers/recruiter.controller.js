const Company = require("../models/Company");
const bcrypt = require("bcryptjs");
const Activity = require("../models/Activity");

exports.register = async (req, res, next) => {
  try {
    const {
      company_name,
      company_email,
      username,
      password,
      phone,
      address,
      city,
      state,
      country,
      established_year,
      total_employees,
      website,
      company_description,
    } = req.body;

    // basic validation
    if (!company_name || !company_email || !username || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await Company.findOne({
      $or: [{ company_email }, { username }],
    });
    if (existing)
      return res
        .status(400)
        .json({ error: "Company email or username already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const established = parseInt(established_year, 10) || null;
    const years_of_experience = established
      ? new Date().getFullYear() - established
      : 0;

    const company = new Company({
      company_name,
      company_email,
      username,
      password: hashed,
      phone,
      address,
      city,
      state,
      country,
      established_year: established,
      years_of_experience,
      total_employees: parseInt(total_employees, 10) || undefined,
      website,
      description: company_description,
      status: "pending",
      role: "recruiter",
      is_verified: false,
    });

    // handle uploaded files
    if (req.files) {
      const files = req.files;
      company.documents = company.documents || {};
      if (files.company_profile_pdf && files.company_profile_pdf[0]) {
        company.documents.profile_pdf = `/uploads/companies/${files.company_profile_pdf[0].filename}`;
      }
      if (files.registration_certificate && files.registration_certificate[0]) {
        company.documents.registration_certificate = `/uploads/companies/${files.registration_certificate[0].filename}`;
      }
      if (files.logo && files.logo[0]) {
        company.documents.logo = `/uploads/companies/${files.logo[0].filename}`;
      }
    }

    await company.save();
    res.status(201).json({ message: "Company registered, pending approval" });
  } catch (err) {
    next(err);
  }
};

// POST /api/recruiter/company/documents
// Accepts multipart fields: company_profile_pdf, registration_certificate, logo
exports.uploadDocuments = async (req, res, next) => {
  try {
    const companyId = req.user._id;
    const comp = await Company.findById(companyId);
    if (!comp) return res.status(404).json({ error: "Company not found" });

    if (!req.files) return res.status(400).json({ error: "No files uploaded" });
    const files = req.files;
    comp.documents = comp.documents || {};
    if (files.company_profile_pdf && files.company_profile_pdf[0]) {
      comp.documents.profile_pdf = `/uploads/companies/${files.company_profile_pdf[0].filename}`;
    }
    if (files.registration_certificate && files.registration_certificate[0]) {
      comp.documents.registration_certificate = `/uploads/companies/${files.registration_certificate[0].filename}`;
    }
    if (files.logo && files.logo[0]) {
      comp.documents.logo = `/uploads/companies/${files.logo[0].filename}`;
    }

    await comp.save();

    await Activity.create({
      companyId,
      type: "company_documents_upload",
      message: "Company documents updated",
    }).catch(() => {});

    res.json({ message: "Documents updated", company: comp });
  } catch (err) {
    next(err);
  }
};
