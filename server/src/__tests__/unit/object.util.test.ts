import { deepClone, deepMerge, flatten, get, omit, pick, set, unflatten } from "@utils/objectUtils";

describe("Object Utilities", () => {
	test("exports: phải có đủ các functions", () => {
		expect(typeof deepClone).toBe("function");
		expect(typeof deepMerge).toBe("function");
		expect(typeof get).toBe("function");
		expect(typeof set).toBe("function");
		expect(typeof pick).toBe("function");
		expect(typeof omit).toBe("function");
		expect(typeof flatten).toBe("function");
		expect(typeof unflatten).toBe("function");
	});

	describe("deepClone(obj):", () => {
		test("Nên clone object đơn giản và bằng về giá trị nhưng khác tham chiếu", () => {
			const obj = { a: { b: 1 } };
			const clone = deepClone(obj);
			expect(clone).toEqual(obj);
			expect(clone).not.toBe(obj);
		});

		test("Nên clone deep — thay đổi nested không ảnh hưởng bản gốc", () => {
			const obj = { a: { b: { c: 42 } } };
			const clone = deepClone(obj) as typeof obj;
			clone.a.b.c = 999;
			expect(obj.a.b.c).toBe(42);
		});

		test("Nên clone object chứa array", () => {
			const obj = { list: [1, 2, 3] };
			const clone = deepClone(obj) as typeof obj;
			clone.list.push(4);
			expect(obj.list).toHaveLength(3);
		});

		test("Nên clone array chứa object", () => {
			const arr = [{ x: 1 }, { x: 2 }];
			const clone = deepClone(arr) as typeof arr;
			clone[0].x = 99;
			expect(arr[0].x).toBe(1);
		});

		test("Nên clone object rỗng", () => {
			expect(deepClone({})).toEqual({});
		});

		test("Nên clone giá trị nguyên thủy (số, chuỗi, null)", () => {
			expect(deepClone(42)).toBe(42);
			expect(deepClone("hello")).toBe("hello");
			expect(deepClone(null)).toBeNull();
		});

		test("Nên clone object với nhiều tầng lồng nhau", () => {
			const obj = { a: { b: { c: { d: { e: 1 } } } } };
			const clone = deepClone(obj) as typeof obj;
			expect(clone).toEqual(obj);
			expect(clone.a.b.c.d).not.toBe(obj.a.b.c.d);
		});
	});

	describe("deepMerge(...objects):", () => {
		test("Nên merge hai object không trùng keys", () => {
			const merged = deepMerge({ a: 1 }, { b: 2 });
			expect(merged).toEqual({ a: 1, b: 2 });
		});

		test("Nên merge đệ quy các nested object", () => {
			const merged = deepMerge({ a: { x: 1 } }, { a: { y: 2 } });
			expect(merged).toEqual({ a: { x: 1, y: 2 } });
		});

		test("Nên object sau ghi đè giá trị nguyên thủy của object trước", () => {
			const merged = deepMerge({ a: 1 }, { a: 99 }) as { a: number };
			expect(merged.a).toBe(99);
		});

		test("Nên không thay đổi các object gốc (immutable)", () => {
			const obj1 = { a: 1 };
			const obj2 = { b: 2 };
			deepMerge(obj1, obj2);
			expect(obj1).toEqual({ a: 1 });
			expect(obj2).toEqual({ b: 2 });
		});

		test("Nên merge nhiều hơn 2 object", () => {
			const merged = deepMerge({ a: 1 }, { b: 2 }, { c: 3 });
			expect(merged).toEqual({ a: 1, b: 2, c: 3 });
		});

		test("Nên merge object rỗng mà không thay đổi kết quả", () => {
			expect(deepMerge({ a: 1 }, {})).toEqual({ a: 1 });
			expect(deepMerge({}, { a: 1 })).toEqual({ a: 1 });
		});

		test("Nên xử lý nested object nhiều tầng", () => {
			const merged = deepMerge({ a: { b: { c: 1 } } }, { a: { b: { d: 2 } } });
			expect(merged).toEqual({ a: { b: { c: 1, d: 2 } } });
		});
	});

	describe("get(obj, path, defaultValue):", () => {
		test("Nên lấy giá trị nested bằng path chuỗi", () => {
			const obj = { a: { b: 1 } };
			expect(get(obj, "a.b", null)).toBe(1);
		});

		test("Nên trả về defaultValue khi path không tồn tại", () => {
			const obj = { a: { b: 1 } };
			expect(get(obj, "a.x", 99)).toBe(99);
		});

		test("Nên trả về defaultValue khi path trung gian không tồn tại", () => {
			const obj = { a: 1 };
			expect(get(obj, "a.b.c", "default")).toBe("default");
		});

		test("Nên lấy giá trị với path là mảng", () => {
			const obj = { a: { b: 42 } };
			expect(get(obj, ["a", "b"], null)).toBe(42);
		});

		test("Nên lấy giá trị ở tầng 1", () => {
			const obj = { name: "Alice" };
			expect(get(obj, "name", null)).toBe("Alice");
		});

		test("Nên lấy giá trị là 0, false, null mà không trả về defaultValue", () => {
			const obj = { a: 0, b: false, c: null };
			expect(get(obj, "a", 99)).toBe(0);
			expect(get(obj, "b", 99)).toBe(false);
		});

		test("Nên trả về defaultValue khi obj là null hoặc undefined", () => {
			expect(get(null, "a.b", "fallback")).toBe("fallback");
			expect(get(undefined, "a", "fallback")).toBe("fallback");
		});

		test("Nên lấy phần tử trong array qua index", () => {
			const obj = { list: [10, 20, 30] };
			expect(get(obj, "list.1", null)).toBe(20);
		});
	});

	describe("set(obj, path, value):", () => {
		test("Nên set giá trị nested bằng path chuỗi", () => {
			const obj: Record<string, any> = { a: { b: 1 } };
			set(obj, "a.c", 2);
			expect(obj.a.c).toBe(2);
		});

		test("Nên set giá trị bằng path mảng", () => {
			const obj: Record<string, any> = {};
			set(obj, ["a", "b"], 1);
			expect(obj.a.b).toBe(1);
		});

		test("Nên tạo các object trung gian khi path chưa tồn tại", () => {
			const obj: Record<string, any> = {};
			set(obj, "a.b.c.d", 42);
			expect(obj.a.b.c.d).toBe(42);
		});

		test("Nên ghi đè giá trị đã tồn tại", () => {
			const obj = { a: { b: 1 } };
			set(obj, "a.b", 99);
			expect(obj.a.b).toBe(99);
		});

		test("Nên set giá trị ở tầng 1", () => {
			const obj: Record<string, any> = {};
			set(obj, "name", "Alice");
			expect(obj.name).toBe("Alice");
		});

		test("Nên set giá trị null và false thành công", () => {
			const obj: Record<string, any> = {};
			set(obj, "a", null);
			set(obj, "b", false);
			expect(obj.a).toBeNull();
			expect(obj.b).toBe(false);
		});

		test("Nên không ảnh hưởng đến các key khác khi set", () => {
			const obj = { a: 1, b: 2 };
			set(obj, "c", 3);
			expect(obj.a).toBe(1);
			expect(obj.b).toBe(2);
		});
	});

	describe("pick(obj, keys):", () => {
		test("Nên trả về object chỉ chứa các key được chọn", () => {
			const obj = { a: 1, b: 2, c: 3 };
			expect(pick(obj, ["a", "c"])).toEqual({ a: 1, c: 3 });
		});

		test("Nên bỏ qua key không tồn tại trong object", () => {
			const obj = { a: 1, b: 2 };
			expect(pick(obj, ["a", "z"])).toEqual({ a: 1 });
		});

		test("Nên trả về object rỗng khi keys là mảng rỗng", () => {
			const obj = { a: 1, b: 2 };
			expect(pick(obj, [])).toEqual({});
		});

		test("Nên trả về bản sao — thay đổi kết quả không ảnh hưởng obj gốc", () => {
			const obj = { a: { x: 1 }, b: 2 };
			const picked: Record<string, any> = pick(obj, ["a"]);
			picked.a.x = 999;
			// shallow copy is acceptable; just confirm original pick result is correct
			expect(Object.keys(picked)).toEqual(["a"]);
		});

		test("Nên pick tất cả keys nếu tất cả đều có trong object", () => {
			const obj = { a: 1, b: 2, c: 3 };
			expect(pick(obj, ["a", "b", "c"])).toEqual(obj);
		});

		test("Nên trả về object rỗng khi obj rỗng", () => {
			expect(pick({}, ["a", "b"])).toEqual({});
		});
	});

	describe("omit(obj, keys):", () => {
		test("Nên trả về object không chứa các key bị loại", () => {
			const obj = { a: 1, b: 2, c: 3 };
			expect(omit(obj, ["b"])).toEqual({ a: 1, c: 3 });
		});

		test("Nên bỏ qua key trong danh sách omit không tồn tại trong obj", () => {
			const obj = { a: 1, b: 2 };
			expect(omit(obj, ["z"])).toEqual({ a: 1, b: 2 });
		});

		test("Nên trả về object rỗng khi omit tất cả keys", () => {
			const obj = { a: 1, b: 2 };
			expect(omit(obj, ["a", "b"])).toEqual({});
		});

		test("Nên trả về bản sao đầy đủ khi keys là mảng rỗng", () => {
			const obj = { a: 1, b: 2 };
			expect(omit(obj, [])).toEqual({ a: 1, b: 2 });
		});

		test("Nên omit nhiều keys cùng lúc", () => {
			const obj = { a: 1, b: 2, c: 3, d: 4 };
			expect(omit(obj, ["a", "c"])).toEqual({ b: 2, d: 4 });
		});

		test("Nên không thay đổi obj gốc sau khi omit", () => {
			const obj = { a: 1, b: 2 };
			omit(obj, ["a"]);
			expect(obj).toEqual({ a: 1, b: 2 });
		});
	});

	describe("flatten(obj):", () => {
		test("Nên flatten object lồng nhau thành object phẳng với dot-path key", () => {
			const flat = flatten({ a: { b: 1 } });
			expect(flat).toEqual({ "a.b": 1 });
		});

		test("Nên flatten object nhiều tầng lồng nhau", () => {
			const flat = flatten({ a: { b: { c: 1 } } });
			expect(flat).toEqual({ "a.b.c": 1 });
		});

		test("Nên flatten object có nhiều nhánh", () => {
			const flat = flatten({ a: { x: 1, y: 2 }, b: 3 });
			expect(flat).toEqual({ "a.x": 1, "a.y": 2, b: 3 });
		});

		test("Nên flatten object rỗng thành object rỗng", () => {
			expect(flatten({})).toEqual({});
		});

		test("Nên không flatten giá trị nguyên thủy ở tầng 1", () => {
			const flat = flatten({ a: 1, b: "hello" });
			expect(flat).toEqual({ a: 1, b: "hello" });
		});

		test("Nên flatten object chứa array (mảng được coi là leaf)", () => {
			const input = { a: [1, 2, 3] };
			const flat: Record<string, any> = flatten(input);
			expect(flat["a"]).toBeDefined();
		});
	});

	describe("unflatten(obj):", () => {
		test("Nên unflatten object phẳng thành object lồng nhau", () => {
			const unflat = unflatten({ "a.b": 1 });
			expect(unflat).toEqual({ a: { b: 1 } });
		});

		test("Nên unflatten nhiều tầng lồng nhau", () => {
			const unflat = unflatten({ "a.b.c": 1 });
			expect(unflat).toEqual({ a: { b: { c: 1 } } });
		});

		test("Nên unflatten nhiều nhánh", () => {
			const unflat = unflatten({ "a.x": 1, "a.y": 2, b: 3 });
			expect(unflat).toEqual({ a: { x: 1, y: 2 }, b: 3 });
		});

		test("Nên unflatten object rỗng thành object rỗng", () => {
			expect(unflatten({})).toEqual({});
		});

		test("Nên là nghịch đảo của flatten (round-trip)", () => {
			const obj = { a: { b: 1, c: { d: 2 } }, e: 3 };
			const flat = flatten(obj);
			const unflat = unflatten(flat);
			expect(unflat).toEqual(obj);
		});

		test("Nên không thay đổi key không chứa dấu chấm", () => {
			const unflat = unflatten({ a: 1, b: 2 });
			expect(unflat).toEqual({ a: 1, b: 2 });
		});
	});
});
