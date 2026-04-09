const User = require('../../models/user/User');
const UserAddress = require('../../models/user/UserAddress');
const UserAcademics = require('../../models/user/UserAcademics');
const UserOtherInfo = require('../../models/user/UserOtherInfo');
const OtherPersonalDetails = require('../../models/user/OtherPersonalDetails');
const GovernmentIdentification = require('../../models/user/GovernmentIdentification');
const DocumentVault = require('../../models/user/DocumentVault');
const CategoryAndReservation = require('../../models/user/CategoryAndReservation');
const db = require('../../config/database');

class FillProfileController {
  /**
   * GET /api/extension/fill-profile
   * Returns the complete student profile structured for the Chrome extension.
   */
  static async getFillProfile(req, res) {
    try {
      const userId = req.user.id;

      const [user, address, academics, otherInfo, otherPersonal, govId, docs, catRes] = await Promise.all([
        User.findById(userId),
        UserAddress.findByUserId(userId),
        UserAcademics.findByUserId(userId),
        UserOtherInfo.findByUserId(userId),
        OtherPersonalDetails.findByUserId(userId),
        GovernmentIdentification.findByUserId(userId),
        DocumentVault.findByUserId(userId),
        CategoryAndReservation.findByUserId(userId)
      ]);

      // Resolve category name from categories table
      let categoryName = '';
      if (catRes?.category_id) {
        try {
          const catResult = await db.query('SELECT name FROM categories WHERE id = $1', [catRes.category_id]);
          categoryName = catResult.rows[0]?.name || '';
        } catch (_) { /* categories table may not exist in all envs */ }
      }

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const profile = {
        student: {
          full_name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          name: user.name || '',
          father_name: user.father_full_name || '',
          mother_name: user.mother_full_name || '',
          guardian_name: user.guardian_name || '',
          dob: user.date_of_birth ? formatDate(user.date_of_birth) : '',
          gender: user.gender || '',
          category: categoryName || otherPersonal?.category || '',
          sub_category: otherPersonal?.sub_category || '',
          disability: catRes?.pwbd_status ? 'Yes' : 'No',
          nationality: user.nationality || 'Indian',
          religion: otherPersonal?.religion || '',
          marital_status: user.marital_status || '',
          mother_tongue: otherPersonal?.mother_tongue || '',
          annual_family_income: otherPersonal?.annual_family_income || '',
          occupation_of_father: otherPersonal?.occupation_of_father || '',
          occupation_of_mother: otherPersonal?.occupation_of_mother || '',
          aadhar_no: govId?.aadhar_number || '',
          id_document_type: govId?.aadhar_number ? 'Aadhaar Card' : '',
          pan_no: govId?.pan_number || '',
          apaar_id: govId?.apaar_id || '',
          mobile: user.phone_number || '',
          alternate_mobile: user.alternate_mobile_number || '',
          email: user.email || '',
          landline: ''
        },
        address: {
          line1: address?.correspondence_address_line1 || '',
          line2: address?.correspondence_address_line2 || '',
          city: address?.city_town_village || '',
          district: address?.district || '',
          state: address?.state || user.state || '',
          pincode: address?.pincode || '',
          country: address?.country || 'India'
        },
        education: {
          class_12: {
            board: academics?.postmatric_board || '',
            school: academics?.postmatric_school_name || '',
            passing_year: academics?.postmatric_passing_year ? String(academics.postmatric_passing_year) : '',
            roll_no: academics?.postmatric_roll_number || '',
            total_marks: cleanNum(academics?.postmatric_total_marks),
            obtained_marks: cleanNum(academics?.postmatric_obtained_marks),
            percentage: cleanNum(academics?.postmatric_percentage),
            state: academics?.postmatric_state || '',
            city: academics?.postmatric_city || '',
            school_pincode: academics?.postmatric_school_pincode || '',
            stream: academics?.stream || '',
            subjects: academics?.subjects || [],
            is_appearing: academics?.is_pursuing_12th || false,
            marks_type: academics?.postmatric_marks_type || '',
            cgpa: academics?.postmatric_cgpa || '',
            result_status: academics?.postmatric_result_status || '',
            pass_status: academics?.postmatric_result_status === 'passed' ? 'Pass'
                        : academics?.postmatric_result_status === 'appeared' ? 'Appeared'
                        : academics?.postmatric_result_status || '',
            education_type: '12th Standard'
          },
          class_10: {
            board: academics?.matric_board || '',
            school: academics?.matric_school_name || '',
            passing_year: academics?.matric_passing_year ? String(academics.matric_passing_year) : '',
            roll_no: academics?.matric_roll_number || '',
            total_marks: cleanNum(academics?.matric_total_marks),
            obtained_marks: cleanNum(academics?.matric_obtained_marks),
            percentage: cleanNum(academics?.matric_percentage),
            state: academics?.matric_state || '',
            city: academics?.matric_city || '',
            school_pincode: academics?.matric_school_pincode || '',
            subjects: academics?.matric_subjects || [],
            marks_type: academics?.matric_marks_type || '',
            result_status: academics?.matric_result_status || ''
          }
        },
        documents: {
          photo:              docs?.passport_size_photograph || user.profile_photo || '',
          signature:          docs?.signature_image || '',
          id_proof:           docs?.valid_photo_id_proof || '',
          aadhar_card:        docs?.valid_photo_id_proof || '',
          matric_marksheet:   docs?.matric_marksheet || '',
          postmatric_marksheet: docs?.postmatric_marksheet || '',
          sc_certificate:     docs?.sc_certificate || '',
          st_certificate:     docs?.st_certificate || '',
          obc_certificate:    docs?.obc_ncl_certificate || '',
          ews_certificate:    docs?.ews_certificate || '',
          pwbd_certificate:   docs?.pwbd_disability_certificate || ''
        },
        other: {
          medium: otherInfo?.medium || '',
          language: otherInfo?.language || ''
        }
      };

      res.json({ success: true, data: profile });
    } catch (error) {
      console.error('Error building fill profile:', error);
      res.status(500).json({ success: false, message: 'Failed to build fill profile' });
    }
  }
}

function cleanNum(v) {
  if (v == null || v === '') return '';
  const s = String(v);
  return s.replace(/\.0+$/, '');
}

function formatDate(dateValue) {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = FillProfileController;
