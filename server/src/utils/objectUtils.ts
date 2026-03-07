/**
 * Kiểm tra xem một giá trị có phải là object thuần (không phải array) hay không.
 * @private
 * @param {any} item - Giá trị cần kiểm tra.
 * @returns {boolean} True nếu là object thuần, ngược lại false.
 */
function _isObject(item: Object | any): boolean {
	return item && typeof item === "object" && !Array.isArray(item) && item.constructor === Object;
}

/**
 * Tạo bản sao sâu (deep clone) của một object.
 * @param {Object} obj - Object cần clone.
 * @returns {Object|null} Bản sao của object hoặc null nếu tham số không phải object.
 */
export function deepClone<T>(obj: T): T {
	return structuredClone(obj);
}

/**
 * Hợp nhất sâu nhiều object thành một object mới.
 * Lưu ý: hàm hiện tại là placeholder và có thể chưa hoàn chỉnh.
 * @param {...Object} objects - Các object cần hợp nhất.
 * @returns {Object} Object đã được hợp nhất.
 */
export function deepMerge(...objects: Array<Object>): object {
	const output: Record<string, any> = {};

	for (const obj of objects) {
		if (!_isObject(obj)) continue;

		for (const key of Object.keys(obj)) {
			const val = (obj as Record<string, any>)[key];

			if (_isObject(val)) {
				// If the target already has an object at this key, merge them recursively
				if (_isObject(output[key])) {
					output[key] = deepMerge(output[key], val);
				} else {
					// Otherwise, just clone the object into the target
					output[key] = deepMerge({}, val);
				}
			} else {
				// For primitives, arrays, nulls, etc., just overwrite
				output[key] = val;
			}
		}
	}

	return output;
}

/**
 * Lấy giá trị lồng nhau từ object theo đường dẫn.
 * @param {Object} obj - Object nguồn.
 * @param {string|string[]} path - Đường dẫn (string dạng 'a.b.c' hoặc mảng các khóa).
 * @param {any} defaultValue - Giá trị trả về nếu không tìm thấy.
 * @returns {any} Giá trị tại đường dẫn hoặc `defaultValue` nếu không tồn tại.
 */
export function get(obj: object | null | undefined, path: string | string[], defaultValue: any): any {
	if (obj === null || obj === undefined) {
		return defaultValue;
	}

	// 1. Chuẩn hóa path thành một mảng các keys
	const keys = Array.isArray(path) ? path : path.split(".");

	// 2. Duyệt qua từng key để đào sâu vào object
	const result = keys.reduce((current: any, key) => {
		// Nếu current là null hoặc undefined, trả về undefined để dừng tìm kiếm
		return current !== null && typeof current !== "undefined" ? current[key] : undefined;
	}, obj);

	return result === undefined ? defaultValue : result;
}

/**
 * Gán giá trị lồng nhau trong object theo đường dẫn, tạo các object trung gian nếu cần.
 * @param {Object} obj - Object nguồn (sẽ bị thay đổi).
 * @param {string|string[]} path - Đường dẫn (string hoặc mảng các khóa).
 * @param {any} value - Giá trị cần gán.
 * @returns {Object} Object đã được cập nhật.
 */
export function set(obj: object, path: string | string[], value: any): object {
	if (Object(obj) !== obj) return obj;

	const keys = Array.isArray(path) ? path : path.split(".");
	let current: any = obj;

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];

		if (!(key in current) || typeof current[key] !== "object" || current[key] === null) {
			current[key] = {};
		}

		current = current[key];
	}

	current[keys[keys.length - 1]] = value;

	return obj;
}

/**
 * Lấy một object mới chỉ chứa các khóa được chỉ định.
 * @param {Object} obj - Object nguồn.
 * @param {string[]} keys - Mảng khóa cần lấy.
 * @returns {Object} Object chỉ gồm các khóa được chọn.
 */
export function pick(obj: object, keys: string[]): object {
	return keys.reduce((acc: Record<string, any>, key) => {
		if (key in obj) {
			acc[key] = (obj as Record<string, any>)[key];
		}

		return acc;
	}, {});
}

/**
 * Tạo một object mới loại bỏ các khóa được chỉ định.
 * @param {Object} obj - Object nguồn.
 * @param {string[]} keys - Mảng khóa cần loại bỏ.
 * @returns {Object} Object sau khi loại bỏ các khóa.
 */
export function omit(obj: object, keys: string[]): object {
	return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key)));
}

/**
 * Làm phẳng một object lồng nhau thành các khóa dạng 'a.b.c'.
 * @param {Object} obj - Object nguồn.
 * @returns {Object} Object đã được làm phẳng.
 */
export function flatten(obj: object): object {
	const result: Record<string, any> = {};

	const recurse = (currentObj: Object, currentPath: string) => {
		for (const key of Object.keys(currentObj)) {
			const value = (currentObj as Record<string, any>)[key];

			const newPath = currentPath ? `${currentPath}.${key}` : key;

			if (_isObject(value)) {
				recurse(value, newPath);
			} else {
				result[newPath] = value;
			}
		}
	};

	if (_isObject(obj)) {
		recurse(obj, "");
	}

	return result;
}

/**
 * Khôi phục object từ dạng phẳng (các khóa dạng 'a.b.c') về object lồng nhau.
 * @param {Object} obj - Object phẳng.
 * @returns {Object} Object lồng lại.
 */
export function unflatten(obj: object): object {
	const result: Record<string, any> = {};

	if (!_isObject(obj)) return result;

	for (const [key, value] of Object.entries(obj)) {
		set(result, key, value);
	}

	return result;
}
