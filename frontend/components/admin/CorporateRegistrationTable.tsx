import React from "react";
import { CorporateAccount } from "@/lib/types";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EyeVisibleIcon, SortIcon, EditIcon } from "@/components/icons";
import { COUNTRY_CODES } from "@/lib/countryCodes";

// Extend CorporateAccount to include user details if they are separate in types.ts
// But typically for table display we might need a joined type.
// For now, let's assume CorporateAccount returned by service includes joined user fields like 'full_name', 'email'.
// Checking types.ts: CorporateAccount has user_id. Doesn't seem to have full_name.
// If the service returns a joined object, we should define an ExtendedCorporateAccount interface or similar.
// Or just use 'any' temporarily if tight on time, but better to allow extra props.
interface ExtendedCorporateAccount extends CorporateAccount {
  full_name?: string; // from joined User
  email?: string;     // from joined User
  // Removed is_blocked because CorporateAccount defines it as 'boolean' data type which cannot be overridden with 'boolean | undefined'
}

interface RegistrationTableProps {
  users: ExtendedCorporateAccount[];
  loading: boolean;
  error: string | null;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onToggleBlock?: (id: string, currentBlock: boolean) => void;
}

const getCountryInfo = (dial: string | undefined) => {
  return (
    COUNTRY_CODES.find((c) => c.dial_code === dial) ?? {
      code: "XX",
      dial_code: dial ?? "",
      flag: "🌐",
      name: "Unknown",
      maxLength: 10,
    }
  );
};

const CorporateRegistrationTable: React.FC<RegistrationTableProps> = ({
  users,
  loading,
  error,
  onToggleStatus,
  onViewDetails,
  onEdit,
  onToggleBlock,
}) => {
  return (
    <div className="w-[calc(100%+2px)] -ml-px h-full flex flex-col rounded-xl border border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-[#19211C]/90 backdrop-blur-sm shadow-xl relative transition-all duration-300 overflow-hidden">
      {loading && users.length > 0 && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center backdrop-blur-sm rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
        </div>
      )}

      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        <table className="w-full border-collapse relative">
          <thead className="sticky top-0 z-20 bg-[#19211C]/4 dark:bg-[#FFFFFF1F] shadow-sm">
            <tr className="text-left">
              <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group">
                <div className="flex items-center gap-1">
                  Name
                  <div className="flex flex-col">
                    <SortIcon sort="asc" />
                  </div>
                </div>
              </th>
              <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group">
                <div className="flex items-center gap-1">
                  Gender
                  <SortIcon sort={null} />
                </div>
              </th>
              <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group">
                <div className="flex items-center gap-1">
                  Email
                  <SortIcon sort={null} />
                </div>
              </th>
              <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group">
                <div className="flex items-center gap-1">
                  Mobile
                  <SortIcon sort={null} />
                </div>
              </th>
              <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group">
                <div className="flex items-center gap-1">
                  Company
                  <SortIcon sort={null} />
                </div>
              </th>
              <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer group">
                Job Title
              </th>
              <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer text-center group">
                <div className="flex items-center gap-1 justify-center">
                  Status
                  <SortIcon sort={null} />
                </div>
              </th>
              <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider cursor-pointer text-center group">
                <div className="flex items-center gap-1 justify-center">
                  BANNED
                  <SortIcon sort={null} />
                </div>
              </th>
              <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary">
            {loading && users.length === 0 ? (
              // Skeleton Rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse bg-white dark:bg-transparent border-b border-brand-light-tertiary dark:border-white/5">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
                  </td>
                  <td className="p-4 text-right align-middle">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : users.length > 0 ? (
              users.map((user, index) => (
                <tr
                  key={user.id || index}
                  className="bg-white dark:bg-transparent border-b border-brand-light-tertiary dark:border-white/5 hover:bg-brand-light-secondary dark:hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user.full_name || 'User'
                          )}&background=random`
                        }
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-brand-light-tertiary dark:border-brand-dark-tertiary"
                      />
                      <span className="text-sm font-medium text-brand-text-light-primary dark:text-white">
                        {user.full_name || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-brand-text-light-primary dark:text-white align-middle">
                    {user.gender}
                  </td>
                  <td className="p-4 text-sm text-brand-text-light-primary dark:text-white align-middle">
                    {user.email || 'N/A'}
                  </td>
                  <td className="p-4 text-sm text-brand-text-light-primary dark:text-white align-middle">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const info = getCountryInfo(user.country_code);

                        return (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-light-secondary dark:bg-[#24272B] border border-brand-light-tertiary/60 dark:border-brand-dark-tertiary/60">
                            {/* Flag */}
                            {info ? (
                              <img
                                src={`https://flagcdn.com/w40/${info.code.toLowerCase()}.png`}
                                srcSet={`https://flagcdn.com/w80/${info.code.toLowerCase()}.png 2x`}
                                width={20}
                                height={14}
                                alt={info.name}
                                className="rounded-[2px] object-cover w-5 h-3.5 xs:w-5 xs:h-3.5 sm:w-5 sm:h-3.5 shrink-0"
                              />
                            ) : (
                              <span className="text-xs">🌐</span>
                            )}

                            {/* Dial code */}
                            <span className="text-[14px] text-gray-600 dark:text-gray-300">
                              {info?.dial_code ?? user.country_code}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Phone number */}
                      <span>{user.mobile_number}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-brand-text-light-primary dark:text-white align-middle">
                    {user.company_name || "-"}
                  </td>
                  <td className="p-4 text-sm text-brand-text-light-primary dark:text-white align-middle">
                    {user.job_title || "-"}
                  </td>
                  <td className="pt-1 text-center align-middle">
                    <ToggleSwitch
                      isOn={!!user.is_active}
                      onToggle={() => onToggleStatus(user.id, !!user.is_active)}
                    />
                  </td>
                  <td className="pt-1 text-center align-middle">
                    <ToggleSwitch
                      isOn={!!user.is_blocked}
                      onToggle={() => onToggleBlock?.(user.id, !!user.is_blocked)}
                      activeColor="bg-red-500"
                      onLabel="YES"
                      offLabel="NO"
                    />
                  </td>
                  <td className="p-4 text-right align-middle">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => onViewDetails && onViewDetails(user.id)}
                        className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <EyeVisibleIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onEdit && onEdit(user.id)}
                        className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={9}
                  className="p-8 text-center text-brand-text-light-secondary dark:text-gray-500"
                >
                  No records found.
                  {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CorporateRegistrationTable;
