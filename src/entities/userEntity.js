import { USER_ROLES, USER_STATUSES } from "../constants/roles";
import { USER_DESIGNATIONS } from "../constants/designations";

export const createUserEntity = (overrides = {}) => ({
  uid: "",

  name: "",
  email: "",
  photo_url: "",

  role: USER_ROLES.PENDING,
  status: USER_STATUSES.PENDING,
  designation: USER_DESIGNATIONS.VOLUNTEER,
  
  department: "",
  programme: "",
  project: "",

  district: "",
  area: "",

  permissions: {},

  last_login_at: null,
  created_at: null,
  updated_at: null,

  ...overrides,
});