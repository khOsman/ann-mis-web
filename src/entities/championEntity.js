import {
  ACCOUNT_STATUS,
  MEMBER_STATUS,
  REGISTRATION_STATUS,
} from "../constants/champions";

export const createChampion = (overrides = {}) => ({
  id: "",

  champion_code: "",

  firebase_uid: "",

  role: "",

  registration_status: REGISTRATION_STATUS.PENDING,

  account_status: ACCOUNT_STATUS.NOT_CREATED,

  invitation_sent_at: null,

  password_set_at: null,

  activated_at: null,

  member_status: MEMBER_STATUS.INACTIVE,

  name: "",
  email: "",
  phone: "",

  date_of_birth: "",

  institution: "",

  address: "",

  photo_url: "",

  joined_at: null,
  last_login_at: null,

  assigned_fgd_ids: [],
  assigned_fgd_count: 0,

  total_evaluated_participants: 0,

  created_at: null,
  updated_at: null,

  ...overrides,
});
