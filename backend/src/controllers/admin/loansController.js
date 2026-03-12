const XLSX = require('xlsx');
const AdmZip = require('adm-zip');
const LoanProvider = require('../../models/loan/LoanProvider');
const LoanDisbursementProcess = require('../../models/loan/LoanDisbursementProcess');
const LoanEligibleCountry = require('../../models/loan/LoanEligibleCountry');
const LoanEligibleCourseType = require('../../models/loan/LoanEligibleCourseType');
const { uploadToS3, deleteFromS3 } = require('../../../utils/storage/s3Upload');

class LoansController {
  static async getAllAdmin(req, res) {
    try {
      const loanProviders = await LoanProvider.findAll();
      res.json({ success: true, data: { loanProviders } });
    } catch (error) {
      console.error('Error fetching loan providers:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch loan providers' });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const providerId = parseInt(id);
      const provider = await LoanProvider.findById(providerId);
      if (!provider) {
        return res.status(404).json({ success: false, message: 'Loan provider not found' });
      }
      const [disbursementProcess, eligibleCountries, eligibleCourseTypes] = await Promise.all([
        LoanDisbursementProcess.findByLoanProviderId(providerId),
        LoanEligibleCountry.findByLoanProviderId(providerId),
        LoanEligibleCourseType.findByLoanProviderId(providerId)
      ]);

      res.json({
        success: true,
        data: {
          loanProvider: provider,
          disbursementProcess: disbursementProcess || [],
          eligibleCountries: eligibleCountries || [],
          eligibleCourseTypes: eligibleCourseTypes || []
        }
      });
    } catch (error) {
      console.error('Error fetching loan provider:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch loan provider' });
    }
  }

  static async uploadLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const s3Url = await uploadToS3(req.file.buffer, req.file.originalname, 'loan-provider-logos');
      res.json({ success: true, data: { logoUrl: s3Url }, message: 'Logo uploaded successfully' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to upload logo' });
    }
  }

  static async create(req, res) {
    try {
      const {
        provider_name,
        provider_type,
        interest_rate_min,
        interest_rate_max,
        processing_fee,
        max_loan_amount,
        moratorium_period_months,
        repayment_duration_years,
        collateral_required,
        coapplicant_required,
        tax_benefit_available,
        official_website_link,
        contact_email,
        contact_phone,
        description,
        logo,
        disbursementProcess,
        eligibleCountries,
        eligibleCourseTypes
      } = req.body;

      if (!provider_name || !provider_name.trim()) {
        return res.status(400).json({ success: false, message: 'Provider name is required' });
      }

      const existing = await LoanProvider.findByName(provider_name.trim());
      if (existing) {
        return res.status(400).json({ success: false, message: 'Loan provider with this name already exists' });
      }

      const provider = await LoanProvider.create({
        provider_name: provider_name.trim(),
        provider_type: provider_type ? provider_type.trim() : null,
        interest_rate_min: interest_rate_min != null ? Number(interest_rate_min) : null,
        interest_rate_max: interest_rate_max != null ? Number(interest_rate_max) : null,
        processing_fee: processing_fee != null ? String(processing_fee).trim() : null,
        max_loan_amount: max_loan_amount != null ? String(max_loan_amount).trim() : null,
        moratorium_period_months: moratorium_period_months ?? null,
        repayment_duration_years: repayment_duration_years ?? null,
        collateral_required: !!collateral_required,
        coapplicant_required: !!coapplicant_required,
        tax_benefit_available: !!tax_benefit_available,
        official_website_link: official_website_link ? official_website_link.trim() : null,
        contact_email: contact_email ? contact_email.trim() : null,
        contact_phone: contact_phone ? contact_phone.trim() : null,
        description: description ? description.trim() : null,
        logo: logo || null
      });

      if (disbursementProcess && Array.isArray(disbursementProcess)) {
        for (const step of disbursementProcess) {
          if (step.step_number != null || (step.description && step.description.trim())) {
            await LoanDisbursementProcess.create({
              loan_provider_id: provider.id,
              step_number: step.step_number ?? null,
              description: step.description ? step.description.trim() : null
            });
          }
        }
      }
      if (eligibleCountries && Array.isArray(eligibleCountries)) {
        for (const item of eligibleCountries) {
          if (item.country_name != null && String(item.country_name).trim()) {
            await LoanEligibleCountry.create({
              loan_provider_id: provider.id,
              country_name: String(item.country_name).trim()
            });
          }
        }
      }
      if (eligibleCourseTypes && Array.isArray(eligibleCourseTypes)) {
        for (const item of eligibleCourseTypes) {
          if (item.course_type != null && String(item.course_type).trim()) {
            await LoanEligibleCourseType.create({
              loan_provider_id: provider.id,
              course_type: String(item.course_type).trim()
            });
          }
        }
      }

      res.status(201).json({
        success: true,
        data: { loanProvider: provider },
        message: 'Loan provider created successfully'
      });
    } catch (error) {
      console.error('Error creating loan provider:', error);
      res.status(500).json({ success: false, message: 'Failed to create loan provider' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const providerId = parseInt(id);
      const existing = await LoanProvider.findById(providerId);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Loan provider not found' });
      }

      const {
        provider_name,
        provider_type,
        interest_rate_min,
        interest_rate_max,
        processing_fee,
        max_loan_amount,
        moratorium_period_months,
        repayment_duration_years,
        collateral_required,
        coapplicant_required,
        tax_benefit_available,
        official_website_link,
        contact_email,
        contact_phone,
        description,
        logo,
        disbursementProcess,
        eligibleCountries,
        eligibleCourseTypes
      } = req.body;

      if (provider_name && provider_name.trim() !== existing.provider_name) {
        const dup = await LoanProvider.findByName(provider_name.trim());
        if (dup) {
          return res.status(400).json({ success: false, message: 'Loan provider with this name already exists' });
        }
      }

      if (logo && logo !== existing.logo && existing.logo) {
        await deleteFromS3(existing.logo);
      }

      await LoanProvider.update(providerId, {
        provider_name: provider_name !== undefined ? provider_name.trim() : undefined,
        provider_type: provider_type !== undefined ? (provider_type && provider_type.trim()) || null : undefined,
        interest_rate_min: interest_rate_min !== undefined ? (interest_rate_min != null ? Number(interest_rate_min) : null) : undefined,
        interest_rate_max: interest_rate_max !== undefined ? (interest_rate_max != null ? Number(interest_rate_max) : null) : undefined,
        processing_fee: processing_fee !== undefined ? (processing_fee != null ? String(processing_fee).trim() : null) : undefined,
        max_loan_amount: max_loan_amount !== undefined ? (max_loan_amount != null ? String(max_loan_amount).trim() : null) : undefined,
        moratorium_period_months: moratorium_period_months !== undefined ? (moratorium_period_months ?? null) : undefined,
        repayment_duration_years: repayment_duration_years !== undefined ? (repayment_duration_years ?? null) : undefined,
        collateral_required: collateral_required !== undefined ? !!collateral_required : undefined,
        coapplicant_required: coapplicant_required !== undefined ? !!coapplicant_required : undefined,
        tax_benefit_available: tax_benefit_available !== undefined ? !!tax_benefit_available : undefined,
        official_website_link: official_website_link !== undefined ? (official_website_link && official_website_link.trim()) || null : undefined,
        contact_email: contact_email !== undefined ? (contact_email && contact_email.trim()) || null : undefined,
        contact_phone: contact_phone !== undefined ? (contact_phone && contact_phone.trim()) || null : undefined,
        description: description !== undefined ? (description && description.trim()) || null : undefined,
        logo: logo !== undefined ? logo : undefined
      });

      await LoanDisbursementProcess.deleteByLoanProviderId(providerId);
      if (disbursementProcess && Array.isArray(disbursementProcess)) {
        for (const step of disbursementProcess) {
          if (step.step_number != null || (step.description && step.description.trim())) {
            await LoanDisbursementProcess.create({
              loan_provider_id: providerId,
              step_number: step.step_number ?? null,
              description: step.description ? step.description.trim() : null
            });
          }
        }
      }

      await LoanEligibleCountry.deleteByLoanProviderId(providerId);
      if (eligibleCountries && Array.isArray(eligibleCountries)) {
        for (const item of eligibleCountries) {
          if (item.country_name != null && String(item.country_name).trim()) {
            await LoanEligibleCountry.create({
              loan_provider_id: providerId,
              country_name: String(item.country_name).trim()
            });
          }
        }
      }

      await LoanEligibleCourseType.deleteByLoanProviderId(providerId);
      if (eligibleCourseTypes && Array.isArray(eligibleCourseTypes)) {
        for (const item of eligibleCourseTypes) {
          if (item.course_type != null && String(item.course_type).trim()) {
            await LoanEligibleCourseType.create({
              loan_provider_id: providerId,
              course_type: String(item.course_type).trim()
            });
          }
        }
      }

      const loanProvider = await LoanProvider.findById(providerId);
      res.json({ success: true, data: { loanProvider }, message: 'Loan provider updated successfully' });
    } catch (error) {
      console.error('Error updating loan provider:', error);
      res.status(500).json({ success: false, message: 'Failed to update loan provider' });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const provider = await LoanProvider.findById(parseInt(id));
      if (!provider) {
        return res.status(404).json({ success: false, message: 'Loan provider not found' });
      }
      if (provider.logo) {
        await deleteFromS3(provider.logo);
      }
      await LoanProvider.delete(parseInt(id));
      res.json({ success: true, message: 'Loan provider deleted successfully' });
    } catch (error) {
      console.error('Error deleting loan provider:', error);
      res.status(500).json({ success: false, message: 'Failed to delete loan provider' });
    }
  }

  static async deleteAll(req, res) {
    try {
      const all = await LoanProvider.findAll();
      for (const p of all) {
        if (p.logo) await deleteFromS3(p.logo);
        await LoanProvider.delete(p.id);
      }
      res.json({
        success: true,
        message: `All ${all.length} loan providers deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting all loan providers:', error);
      res.status(500).json({ success: false, message: 'Failed to delete all loan providers' });
    }
  }

  static async downloadBulkTemplate(req, res) {
    try {
      const headers = [
        'provider_name',
        'provider_type',
        'logo_filename',
        'interest_rate_min',
        'interest_rate_max',
        'processing_fee',
        'max_loan_amount',
        'moratorium_period_months',
        'repayment_duration_years',
        'collateral_required',
        'coapplicant_required',
        'tax_benefit_available',
        'official_website_link',
        'contact_email',
        'contact_phone',
        'description',
        'disbursement_process',
        'eligible_countries',
        'eligible_course_types'
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        [
          'HDFC Credila',
          'NBFC',
          'credila.png',
          '10.5',
          '14',
          '1% of loan amount',
          '50 Lakh',
          '12',
          '15',
          'FALSE',
          'FALSE',
          'TRUE',
          'https://credila.com',
          'support@credila.com',
          '9876543210',
          'Education loan provider for students.',
          '1|Submit application;2|Document verification;3|Disbursement',
          'India',
          'UG;PG;Diploma'
        ]
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Loan Providers');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=loan-providers-bulk-template.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating bulk template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate template' });
    }
  }

  /** Download all loan providers data as Excel (Super Admin only). Same columns as bulk template. */
  static async downloadAllExcel(req, res) {
    try {
      const providers = await LoanProvider.findAll();
      const headers = [
        'provider_name', 'provider_type', 'logo_filename', 'interest_rate_min', 'interest_rate_max', 'processing_fee',
        'max_loan_amount', 'moratorium_period_months', 'repayment_duration_years', 'collateral_required', 'coapplicant_required', 'tax_benefit_available',
        'official_website_link', 'contact_email', 'contact_phone', 'description',
        'disbursement_process', 'eligible_countries', 'eligible_course_types'
      ];
      const rows = [headers];
      for (const p of providers) {
        const [disbursement, countries, courseTypes] = await Promise.all([
          LoanDisbursementProcess.findByLoanProviderId(p.id),
          LoanEligibleCountry.findByLoanProviderId(p.id),
          LoanEligibleCourseType.findByLoanProviderId(p.id)
        ]);
        const logoFilename = (p.logo && typeof p.logo === 'string' && p.logo.split('/').pop()) ? p.logo.split('/').pop() : '';
        const dispStr = (disbursement && disbursement.length)
          ? disbursement.sort((a, b) => (a.step_number || 0) - (b.step_number || 0)).map((x) => `${x.step_number || ''}|${x.description || ''}`).join(';')
          : '';
        const countryStr = (countries && countries.length) ? countries.map((c) => c.country_name || '').filter(Boolean).join(';') : '';
        const courseStr = (courseTypes && courseTypes.length) ? courseTypes.map((ct) => ct.course_type || '').filter(Boolean).join(';') : '';
        rows.push([
          p.provider_name || '',
          p.provider_type || '',
          logoFilename,
          p.interest_rate_min != null ? String(p.interest_rate_min) : '',
          p.interest_rate_max != null ? String(p.interest_rate_max) : '',
          p.processing_fee || '',
          p.max_loan_amount || '',
          p.moratorium_period_months != null ? String(p.moratorium_period_months) : '',
          p.repayment_duration_years != null ? String(p.repayment_duration_years) : '',
          p.collateral_required ? 'TRUE' : 'FALSE',
          p.coapplicant_required ? 'TRUE' : 'FALSE',
          p.tax_benefit_available ? 'TRUE' : 'FALSE',
          p.official_website_link || '',
          p.contact_email || '',
          p.contact_phone || '',
          p.description || '',
          dispStr,
          countryStr,
          courseStr
        ]);
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Loan Providers');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=loan-providers-all-data.xlsx');
      res.send(buf);
    } catch (error) {
      console.error('Error generating loan providers export:', error);
      res.status(500).json({ success: false, message: 'Failed to export loan providers data' });
    }
  }

  static async bulkUpload(req, res) {
    try {
      const excelFile = req.files?.excel?.[0] || req.file;
      if (!excelFile || !excelFile.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded. Use field name "excel".'
        });
      }

      const logoMap = new Map();
      const logosZipFile = req.files?.logos_zip?.[0];
      if (logosZipFile && logosZipFile.buffer) {
        try {
          const zip = new AdmZip(logosZipFile.buffer);
          const entries = zip.getEntries();
          const imageExt = /\.(jpe?g|png|gif|webp|bmp)$/i;
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry.isDirectory) continue;
            const name = (entry.entryName || entry.name || '').replace(/^.*[\\/]/, '').trim();
            if (!name || !imageExt.test(name)) continue;
            const buffer = entry.getData();
            if (buffer && buffer.length) logoMap.set(name.toLowerCase(), { buffer, originalname: name });
          }
        } catch (zipErr) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or corrupted ZIP file for logos.'
          });
        }
      } else {
        const logosRaw = req.files?.logos;
        const logoFiles = Array.isArray(logosRaw) ? logosRaw : (logosRaw ? [logosRaw] : []);
        logoFiles.forEach((f) => {
          if (f && (f.buffer || f.path)) {
            const name = (f.originalname || f.name || '').trim();
            if (name) logoMap.set(name.toLowerCase(), f);
          }
        });
      }

      let workbook;
      try {
        workbook = XLSX.read(excelFile.buffer, { type: 'buffer', raw: true });
      } catch (parseErr) {
        return res.status(400).json({ success: false, message: 'Invalid Excel file or format.' });
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (!rows.length) {
        return res.status(400).json({ success: false, message: 'Excel file has no data rows.' });
      }

      const created = [];
      const errors = [];
      const namesInFile = new Set();

      const getVal = (row, ...keys) => {
        for (const k of keys) {
          const v = row[k] ?? row[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())];
          if (v !== undefined && v !== null && v !== '') return String(v).trim();
        }
        return null;
      };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const name = getVal(row, 'provider_name', 'provider_Name') || '';
        if (!name) {
          errors.push({ row: rowNum, message: 'provider_name is required' });
          continue;
        }
        if (namesInFile.has(name.toLowerCase())) {
          errors.push({ row: rowNum, message: `duplicate name "${name}" in this file` });
          continue;
        }
        const existing = await LoanProvider.findByName(name);
        if (existing) {
          errors.push({ row: rowNum, message: `loan provider "${name}" already exists` });
          continue;
        }

        const logoFilename = getVal(row, 'logo_filename', 'logo_Filename');
        let logoUrl = null;
        if (logoFilename) {
          const logoFile = logoMap.get(logoFilename.toLowerCase());
          if (logoFile && logoFile.buffer) {
            try {
              logoUrl = await uploadToS3(logoFile.buffer, logoFile.originalname || logoFilename, 'loan-provider-logos');
            } catch (uploadErr) {
              errors.push({ row: rowNum, message: `logo upload failed for "${logoFilename}": ${uploadErr.message}` });
            }
          } else {
            errors.push({ row: rowNum, message: `logo file not found: "${logoFilename}"` });
          }
        }

        const interestRateMin = getVal(row, 'interest_rate_min');
        const interestRateMax = getVal(row, 'interest_rate_max');
        const moratorium = getVal(row, 'moratorium_period_months');
        const repayment = getVal(row, 'repayment_duration_years');
        const collateral = /^(1|true|yes)$/i.test(getVal(row, 'collateral_required') || '');
        const coapplicant = /^(1|true|yes)$/i.test(getVal(row, 'coapplicant_required') || '');
        const taxBenefit = /^(1|true|yes)$/i.test(getVal(row, 'tax_benefit_available') || '');
        const disbursementRaw = getVal(row, 'disbursement_process') || '';
        const countriesRaw = getVal(row, 'eligible_countries') || '';
        const courseTypesRaw = getVal(row, 'eligible_course_types') || '';

        try {
          const provider = await LoanProvider.create({
            provider_name: name,
            provider_type: getVal(row, 'provider_type') || null,
            interest_rate_min: interestRateMin ? parseFloat(interestRateMin) : null,
            interest_rate_max: interestRateMax ? parseFloat(interestRateMax) : null,
            processing_fee: getVal(row, 'processing_fee') || null,
            max_loan_amount: getVal(row, 'max_loan_amount') || null,
            moratorium_period_months: moratorium ? parseInt(moratorium, 10) : null,
            repayment_duration_years: repayment ? parseInt(repayment, 10) : null,
            collateral_required: collateral,
            coapplicant_required: coapplicant,
            tax_benefit_available: taxBenefit,
            official_website_link: getVal(row, 'official_website_link') || null,
            contact_email: getVal(row, 'contact_email') || null,
            contact_phone: getVal(row, 'contact_phone') || null,
            description: getVal(row, 'description') || null,
            logo: logoUrl
          });
          if (disbursementRaw) {
            const steps = disbursementRaw.split(';').map((s) => s.trim()).filter(Boolean);
            for (const step of steps) {
              const [num, desc] = step.split('|').map((s) => s.trim());
              const step_number = num ? parseInt(num, 10) : null;
              if (step_number != null || desc) {
                await LoanDisbursementProcess.create({
                  loan_provider_id: provider.id,
                  step_number: isNaN(step_number) ? null : step_number,
                  description: desc || null
                });
              }
            }
          }
          if (countriesRaw) {
            const countries = countriesRaw.split(';').map((s) => s.trim()).filter(Boolean);
            for (const c of countries) await LoanEligibleCountry.create({ loan_provider_id: provider.id, country_name: c });
          }
          if (courseTypesRaw) {
            const types = courseTypesRaw.split(';').map((s) => s.trim()).filter(Boolean);
            for (const t of types) await LoanEligibleCourseType.create({ loan_provider_id: provider.id, course_type: t });
          }
          created.push({ id: provider.id, name: provider.provider_name });
          namesInFile.add(name.toLowerCase());
        } catch (createErr) {
          errors.push({ row: rowNum, message: createErr.message || 'Failed to create loan provider' });
        }
      }

      res.json({
        success: true,
        data: {
          created: created.length,
          createdLoanProviders: created,
          errors: errors.length,
          errorDetails: errors
        },
        message: `Created ${created.length} loan provider(s).${errors.length ? ` ${errors.length} row(s) had errors.` : ''}`
      });
    } catch (error) {
      console.error('Error in bulk upload:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Bulk upload failed'
      });
    }
  }
}

module.exports = LoansController;
