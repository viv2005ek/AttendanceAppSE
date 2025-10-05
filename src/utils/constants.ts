// Application constants and configurations
export const ROOM_SIZES: { [key: string]: number } = {
  small: 5,
  mid: 10,
  large: 15,
};

export const CORRECTNESS_RANGE = 5; // Additional buffer in meters (deprecated - use accuracy from device)
export const STUDENT_BASE_RADIUS = 2; // Base student radius in meters (+ device accuracy)

export const ACTIVE_DURATIONS = [5, 10, 15]; // Minutes

export const OVERLAP_THRESHOLDS = {
  PRESENT: 70,
  CHECK_MIN: 40,
  CHECK_MAX: 70,
  PROXY: 40,
};

export const STATUS_COLORS = {
  present: '#10B981', // Green
  check: '#F59E0B',   // Yellow
  proxy: '#EF4444',   // Red
  not_in_list: '#EF4444', // Red
};

export const ATTENDANCE_STATUS_LABELS = {
  present: 'Present',
  check: 'Please Check',
  proxy: 'Proxy',
  not_in_list: 'Not in List',
};